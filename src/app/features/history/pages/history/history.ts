import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, HistoryItem, HistoryDetail } from '../../../../core/services/data.service';

@Component({
  selector: 'app-history',
  imports: [TranslatePipe],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History implements OnInit {
  private data = inject(DataService);

  items = signal<HistoryItem[]>([]);
  loading = signal(true);

  selectedType       = signal('all');
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
    const tech   = this.selectedTechnician() !== 'all' ? this.selectedTechnician() : undefined;
    // Pass type as status param if needed; backend paged endpoint accepts status/search
    // We pass type as search context — for client-side tech filter we filter after load
    this.data.getHistoryPaged(undefined, undefined, this.currentPage(), this.pageSize).subscribe(response => {
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

  // ── Detail modal ────────────────────────────────────────────
  showDetailModal = signal(false);
  detailItem = signal<HistoryDetail | null>(null);
  detailLoading = signal(false);

  openDetail(id: number | string): void {
    // Build detail from the already-loaded list (backend has no /history/{id} endpoint)
    const found = this.items().find(i => i.id == id);
    if (found) {
      this.detailItem.set(found as unknown as HistoryDetail);
      this.detailLoading.set(false);
    } else {
      this.detailLoading.set(true);
      this.detailItem.set(null);
      this.data.getHistoryById(id).subscribe(item => {
        this.detailItem.set(item);
        this.detailLoading.set(false);
      });
    }
    this.showDetailModal.set(true);
  }

  closeDetail(): void {
    this.showDetailModal.set(false);
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
