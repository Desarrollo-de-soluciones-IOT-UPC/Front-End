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

  items = signal<HistoryItem[]>([]);
  loading = signal(true);

  selectedType       = signal('all');
  selectedStatus     = signal('all');
  selectedTechnician = signal('all');
  dateFrom           = signal('');
  dateTo             = signal('');

  // Pagination signals
  currentPage   = signal(0);
  totalPages    = signal(0);
  totalElements = signal(0);
  readonly pageSize = 10;

  // Technician list derived from loaded page (server-side filtering handles the rest)
  technicians = computed(() => {
    const names = [...new Set(this.items().map(i => i.technician))];
    return names;
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
    const type   = this.selectedType()       !== 'all' ? this.selectedType()       : undefined;
    const status = this.selectedStatus()     !== 'all' ? this.selectedStatus()     : undefined;
    const tech   = this.selectedTechnician() !== 'all' ? this.selectedTechnician() : undefined;
    // Status is filtered server-side; type/tech/date are refined on the loaded page.
    this.data.getHistoryPaged(status, undefined, this.currentPage(), this.pageSize).subscribe(response => {
      let content = response.content;
      // Apply client-side filters on the current page
      if (type !== undefined) {
        content = content.filter(i => i.serviceType.toLowerCase() === type.toLowerCase());
      }
      if (tech !== undefined) {
        content = content.filter(i => i.technician === tech);
      }
      const from = this.dateFrom();
      const to   = this.dateTo();
      if (from) {
        const fromMs = new Date(from).getTime();
        content = content.filter(i => new Date(i.completionDate).getTime() >= fromMs);
      }
      if (to) {
        const toMs = new Date(to).getTime();
        content = content.filter(i => new Date(i.completionDate).getTime() <= toMs);
      }
      this.items.set(content);
      this.totalPages.set(response.totalPages);
      this.totalElements.set(response.totalElements);
      this.loading.set(false);
    });
  }

  applyFilters(): void {
    this.currentPage.set(0);
    this.loadItems();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadItems();
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
