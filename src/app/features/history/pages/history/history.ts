import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, HistoryItem } from '../../../../core/services/data.service';

@Component({
  selector: 'app-history',
  imports: [TranslatePipe],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History implements OnInit {
  private data = inject(DataService);

  private _allItems = signal<HistoryItem[]>([]);
  loading = signal(true);

  selectedType       = signal('all');
  selectedTechnician = signal('all');
  dateFrom           = signal('');
  dateTo             = signal('');

  technicians = computed(() => {
    const names = [...new Set(this._allItems().map(i => i.technician))];
    return names;
  });

  items = computed(() => {
    let list = this._allItems();
    const t    = this.selectedType();
    const tech = this.selectedTechnician();
    const from = this.dateFrom();
    const to   = this.dateTo();

    if (t !== 'all') {
      list = list.filter(i => i.serviceType.toLowerCase() === t.toLowerCase());
    }
    if (tech !== 'all') {
      list = list.filter(i => i.technician === tech);
    }
    if (from) {
      const fromMs = new Date(from).getTime();
      list = list.filter(i => new Date(i.completionDate).getTime() >= fromMs);
    }
    if (to) {
      const toMs = new Date(to).getTime();
      list = list.filter(i => new Date(i.completionDate).getTime() <= toMs);
    }
    return list;
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
    this.data.getHistory().subscribe(items => {
      this._allItems.set(items);
      this.loading.set(false);
    });
  }

  clearDates(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
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
