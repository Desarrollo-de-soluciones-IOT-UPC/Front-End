import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, HistoryItem, TechWorkOrder } from '../../../../core/services/data.service';
import { WorkOrderDetailModal } from '../../../../shared/components/work-order-detail-modal/work-order-detail-modal';

@Component({
  selector: 'app-tech-history',
  imports: [FormsModule, TranslatePipe, WorkOrderDetailModal],
  templateUrl: './tech-history.html',
  styleUrl: './tech-history.scss',
})
export class TechHistory implements OnInit {
  private data = inject(DataService);

  protected items      = signal<HistoryItem[]>([]);
  protected loading    = signal(true);

  protected dateFrom     = signal('');
  protected dateTo       = signal('');
  protected typeFilter   = signal('all');
  protected statusFilter = signal('all');

  // Pagination signals
  protected currentPage   = signal(0);
  protected totalPages    = signal(0);
  protected totalElements = signal(0);
  readonly pageSize = 10;

  // Alias for template compatibility
  protected get filtered() { return this.items; }

  ngOnInit(): void {
    this.loadItems();
  }

  private loadItems(): void {
    this.loading.set(true);
    const status = this.statusFilter() !== 'all' ? this.statusFilter() : undefined;
    this.data.getTechHistoryPaged(status, undefined, this.currentPage(), this.pageSize).subscribe(response => {
      let content = response.content;
      const type = this.typeFilter();
      const from = this.dateFrom();
      const to   = this.dateTo();

      if (type !== 'all') content = content.filter(h => h.serviceType === type);
      if (from) content = content.filter(h => h.completionDate >= from);
      if (to)   content = content.filter(h => h.completionDate <= to);

      this.items.set(content);
      this.totalPages.set(response.totalPages);
      this.totalElements.set(response.totalElements);
      this.loading.set(false);
    });
  }

  protected applyFilters(): void {
    this.currentPage.set(0);
    this.loadItems();
  }

  protected goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadItems();
    }
  }

  protected getPagesArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }

  protected min(a: number, b: number): number {
    return Math.min(a, b);
  }

  protected clearDates(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.applyFilters();
  }

  // ── Detail modal (same shared read-only view as the admin History) ──────────
  protected showDetailModal = signal(false);
  protected detailOrder     = signal<TechWorkOrder | null>(null);
  protected detailLoading   = signal(false);

  protected openDetail(item: HistoryItem): void {
    this.detailOrder.set(null);
    this.showDetailModal.set(true);
    if (item.workOrderId) {
      this.detailLoading.set(true);
      this.data.getTechWorkOrderById(item.workOrderId).subscribe(order => {
        this.detailOrder.set(order ?? this.fallbackOrder(item));
        this.detailLoading.set(false);
      });
    } else {
      this.detailOrder.set(this.fallbackOrder(item));
      this.detailLoading.set(false);
    }
  }

  protected closeDetail(): void {
    this.showDetailModal.set(false);
    this.detailOrder.set(null);
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

  protected exportCsv(): void {
    const rows = [
      ['Order ID', 'Completion Date', 'Client / Site', 'Service Type', 'Lead Technician', 'Status'],
      ...this.filtered().map(h => [
        h.orderId, h.completionDate, `${h.client} - ${h.site}`, h.serviceType, h.technician, h.status,
      ]),
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'history.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  protected statusClass(s: string): string {
    return s === 'completed' ? 'badge--completed' : 'badge--cancelled';
  }

  protected typeIcon(type: string): string {
    return type === 'Installation' ? 'ph-monitor'
      : type === 'Maintenance'    ? 'ph-wrench'
      : 'ph-package';
  }
}
