import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, HistoryItem } from '../../../../core/services/data.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-tech-history',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './tech-history.html',
  styleUrl: './tech-history.scss',
})
export class TechHistory {
  private data = inject(DataService);
  private auth = inject(AuthService);

  private _all  = toSignal(this.data.getHistory(), { initialValue: [] as HistoryItem[] });
  private myName = computed(() => this.auth.currentUser()?.name ?? '');
  private all   = computed(() => this._all().filter(h => h.technician === this.myName()));

  protected dateFrom  = signal('');
  protected dateTo    = signal('');
  protected typeFilter = signal('all');
  protected techFilter = signal('all');

  protected technicians = computed(() => {
    const unique = new Set(this.all().map(h => h.technician));
    return Array.from(unique).sort();
  });

  protected filtered = computed(() => {
    const from = this.dateFrom();
    const to   = this.dateTo();
    const type = this.typeFilter();
    const tech = this.techFilter();

    return this.all().filter(h => {
      const matchType = type === 'all' || h.serviceType === type;
      const matchTech = tech === 'all' || h.technician === tech;
      const matchFrom = !from || h.completionDate >= from;
      const matchTo   = !to   || h.completionDate <= to;
      return matchType && matchTech && matchFrom && matchTo;
    });
  });

  protected clearDates(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
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
