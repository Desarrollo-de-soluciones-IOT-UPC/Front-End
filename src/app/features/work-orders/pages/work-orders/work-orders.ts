import { Component, inject, HostListener, signal, computed, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';
import { DataService, WorkOrder } from '../../../../core/services/data.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-work-orders',
  imports: [NgApexchartsModule, TranslatePipe, RouterLink],
  templateUrl: './work-orders.html',
  styleUrl: './work-orders.scss',
})
export class WorkOrders implements OnInit {
  protected lang    = inject(LanguageService);
  private data      = inject(DataService);
  private confirm   = inject(ConfirmService);
  private toast     = inject(ToastService);

  // Source data (writable so we can update after delete)
  private _allOrders = signal<WorkOrder[]>([]);
  loading = signal(true);

  // Filter signals
  searchQuery  = signal('');
  selectedType   = signal('all');
  selectedStatus = signal('all');

  // Filtered computed list
  orders = computed(() => {
    let list = this._allOrders();
    const q = this.searchQuery().toLowerCase().trim();
    const t = this.selectedType();
    const s = this.selectedStatus();

    if (q) {
      list = list.filter(o =>
        o.client.toLowerCase().includes(q) ||
        o.technician.toLowerCase().includes(q) ||
        o.orderId.toLowerCase().includes(q) ||
        o.location.toLowerCase().includes(q)
      );
    }
    if (t !== 'all') {
      list = list.filter(o => o.type.toLowerCase() === t.toLowerCase());
    }
    if (s !== 'all') {
      list = list.filter(o => o.status === s);
    }
    return list;
  });

  openMenuIndex: number | null = null;

  ngOnInit(): void {
    this.loadOrders();
    this.data.getChartData().subscribe(c => {
      if (!c) return;
      this.regionalSeries = [{ name: 'Orders', data: c.regional.series }];
      this.regionalXAxis  = { ...this.regionalXAxis, categories: c.regional.categories };
    });
  }

  loadOrders(): void {
    this.loading.set(true);
    this.data.getWorkOrders().subscribe(orders => {
      this._allOrders.set(orders);
      this.loading.set(false);
    });
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.openMenuIndex = null;
  }

  toggleMenu(index: number, event: Event): void {
    event.stopPropagation();
    this.openMenuIndex = this.openMenuIndex === index ? null : index;
  }

  deleteOrder(id: number | string, event: Event): void {
    event.stopPropagation();
    if (!this.confirm.confirm('Are you sure you want to delete this work order?')) return;
    this.data.deleteWorkOrder(id).subscribe(() => {
      this._allOrders.update(list => list.filter(o => String(o.id) !== String(id)));
      this.toast.success('Work order deleted successfully');
    });
    this.openMenuIndex = null;
  }

  // ── Charts ────────────────────────────────────────────────────
  regionalSeries: { name: string; data: number[] }[] = [{ name: 'Orders', data: [] }];
  regionalChart  = { type: 'bar', height: 130, toolbar: { show: false }, background: 'transparent' } as const;
  regionalXAxis: { categories: string[]; labels: object; axisBorder: object; axisTicks: object } = {
    categories: [],
    labels: { style: { colors: '#6b7280', fontSize: '12px', fontFamily: 'Manrope, sans-serif' } },
    axisBorder: { show: false },
    axisTicks:  { show: false },
  };
  regionalPlotOptions = { bar: { borderRadius: 4, columnWidth: '55%' } };
  regionalColors      = ['#1a6eff'];
  regionalGrid        = { borderColor: '#f0f2f5', yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } };
  regionalDataLabels  = { enabled: false };
  regionalTooltip     = { theme: 'light' };
}
