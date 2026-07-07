import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, HistoryItem, TechWorkOrder } from '../../../../core/services/data.service';
import { WorkOrderDetailModal } from '../../../../shared/components/work-order-detail-modal/work-order-detail-modal';

@Component({
  selector: 'app-history',
  imports: [TranslatePipe, WorkOrderDetailModal],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History implements OnInit {
  private data = inject(DataService);

  // Full result set for the current status filter; type/tech/date + pagination
  // are applied client-side so the counter/paginator match what is shown.
  private allItems = signal<HistoryItem[]>([]);
  loading = signal(true);

  selectedType       = signal('all');
  selectedStatus     = signal('all');
  selectedTechnician = signal('all');
  dateFrom           = signal('');
  dateTo             = signal('');

  // Pagination
  currentPage   = signal(0);
  readonly pageSize = 10;

  // Technician options from the whole (status-filtered) set.
  technicians = computed(() => [...new Set(this.allItems().map(i => i.technician))]);

  /** Rows after applying type/technician/date filters over the full set. */
  filteredItems = computed(() => {
    const type = this.selectedType();
    const tech = this.selectedTechnician();
    const from = this.dateFrom();
    const to   = this.dateTo();
    return this.allItems().filter(i => {
      if (type !== 'all' && i.serviceType.toLowerCase() !== type.toLowerCase()) return false;
      if (tech !== 'all' && i.technician !== tech) return false;
      if (from && new Date(i.completionDate).getTime() < new Date(from).getTime()) return false;
      if (to && new Date(i.completionDate).getTime() > new Date(to).getTime()) return false;
      return true;
    });
  });

  totalElements = computed(() => this.filteredItems().length);
  totalPages    = computed(() => Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize)));

  // Current page slice (what the template renders).
  items = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  });

  dateRangeLabel = computed(() => {
    const from = this.dateFrom();
    const to   = this.dateTo();
    if (!from && !to) return null;
    const fmt = (s: string) =>
      new Date(s).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    if (from && to)  return `${fmt(from)} – ${fmt(to)}`;
    if (from)        return `From ${fmt(from)}`;
    return `Until ${fmt(to)}`;
  });

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading.set(true);
    // Only status is filtered server-side; the full matching set is loaded so
    // type/technician/date and pagination can be computed client-side honestly.
    const status = this.selectedStatus() !== 'all' ? this.selectedStatus() : undefined;
    this.data.getHistory(status).subscribe(rows => {
      this.allItems.set(rows);
      this.loading.set(false);
    });
  }

  applyFilters(): void {
    this.currentPage.set(0);
    this.loadItems();
  }

  goToPage(page: number): void {
    // Pure client-side paging over the filtered set — no server round-trip.
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  clearDates(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.applyFilters();
  }

  // ── Detail modal (full read-only work-order detail) ─────────
  showDetailModal = signal(false);
  detailOrder = signal<TechWorkOrder | null>(null);
  detailLoading = signal(false);

  openDetail(item: HistoryItem): void {
    this.detailOrder.set(null);
    this.showDetailModal.set(true);
    if (item.workOrderId) {
      this.detailLoading.set(true);
      this.data.getWorkOrderDetail(item.workOrderId).subscribe(order => {
        this.detailOrder.set(order ?? this.fallbackOrder(item));
        this.detailLoading.set(false);
      });
    } else {
      // Seeded history rows have no live work order — show the snapshot data.
      this.detailOrder.set(this.fallbackOrder(item));
      this.detailLoading.set(false);
    }
  }

  /** Minimal detail built from a history snapshot (for rows without a live order). */
  private fallbackOrder(item: HistoryItem): TechWorkOrder {
    return {
      id: item.workOrderId ?? item.id,
      orderId: item.orderId,
      type: item.serviceType,
      status: item.status,
      client: item.client,
      location: item.site,
      scheduledDate: item.completionDate,
      scheduledTime: item.completionTime,
      technicianId: 0,
      priority: '',
      serviceType: item.serviceType,
      contactName: item.technician,
      contactRole: '',
      contactPhone: '',
      contactEmail: '',
      accessInstructions: '',
      requiredTools: [],
      expectedSensors: 0,
      assetId: '',
      sensors: [],
      technicianNotes: '',
      activityLog: [],
      clientDevices: [],
      evidence: [],
      maintenanceActions: [],
    } as TechWorkOrder;
  }

  closeDetail(): void {
    this.showDetailModal.set(false);
    this.detailOrder.set(null);
  }

  exportCsv(): void {
    const rows = this.items();
    if (!rows.length) return;

    const headers = ['Order ID', 'Completion Date', 'Completion Time', 'Client', 'Site', 'Service Type', 'Technician', 'Status'];
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [r.orderId, r.completionDate, r.completionTime, r.client, r.site, r.serviceType, r.technician, r.status]
          .map(v => `"${v}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'work-orders-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
