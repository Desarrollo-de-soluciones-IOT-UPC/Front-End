import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, HistoryItem } from '../../../../core/services/data.service';

@Component({
  selector: 'app-tech-history',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './tech-history.html',
  styleUrl: './tech-history.scss',
})
export class TechHistory implements OnInit {
  private data = inject(DataService);

  protected items      = signal<HistoryItem[]>([]);
  protected loading    = signal(true);

  protected dateFrom   = signal('');
  protected dateTo     = signal('');
  protected typeFilter = signal('all');
  protected techFilter = signal('all');

  // Pagination signals
  protected currentPage   = signal(0);
  protected totalPages    = signal(0);
  protected totalElements = signal(0);
  readonly pageSize = 10;

  protected technicians = computed(() => {
    const unique = new Set(this.items().map(h => h.technician));
    return Array.from(unique).sort();
  });

  // Alias for template compatibility
  protected get filtered() { return this.items; }

  ngOnInit(): void {
    this.loadItems();
  }

  private loadItems(): void {
    this.loading.set(true);
    this.data.getTechHistoryPaged(undefined, undefined, this.currentPage(), this.pageSize).subscribe(response => {
      let content = response.content;
      const type = this.typeFilter();
      const tech = this.techFilter();
      const from = this.dateFrom();
      const to   = this.dateTo();

      if (type !== 'all') content = content.filter(h => h.serviceType === type);
      if (tech !== 'all') content = content.filter(h => h.technician === tech);
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
    return type === 'Installation' ? 'ph-wrench'
      : type === 'Maintenance'    ? 'ph-broadcast'
      : 'ph-database';
  }
}
