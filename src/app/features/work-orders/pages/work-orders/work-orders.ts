import { Component, inject, HostListener, signal, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';
import { DataService, WorkOrder } from '../../../../core/services/data.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-work-orders',
  imports: [NgApexchartsModule, TranslatePipe, RouterLink, FormsModule],
  templateUrl: './work-orders.html',
  styleUrl: './work-orders.scss',
})
export class WorkOrders implements OnInit {
  protected lang    = inject(LanguageService);
  private data      = inject(DataService);
  private toast     = inject(ToastService);
  private activity  = inject(ActivityService);
  private router    = inject(Router);

  orders = signal<WorkOrder[]>([]);
  loading = signal(true);

  // Filter signals
  searchQuery    = signal('');
  selectedType   = signal('all');
  selectedStatus = signal('all');
  // Sort: 'date' = closest scheduled date first; 'created' = newest added first
  sortBy         = signal('date');

  // Pagination signals
  currentPage    = signal(0);
  totalPages     = signal(0);
  totalElements  = signal(0);
  readonly pageSize = 10;

  openMenuIndex: number | null = null;

  // Delete confirm modal (now also captures the cancellation/deletion reason,
  // which is recorded in History as a Cancelled entry by the backend).
  showDeleteModal  = signal(false);
  deleteOrderId: number | string | null = null;
  deleteReason = '';

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    const status = this.selectedStatus() !== 'all' ? this.selectedStatus() : undefined;
    const type   = this.selectedType()   !== 'all' ? this.selectedType()   : undefined;
    const search = this.searchQuery().trim() || undefined;
    this.data.getWorkOrdersPaged(status, type, search, this.currentPage(), this.pageSize, this.sortBy()).subscribe(response => {
      this.orders.set(response.content);
      this.totalPages.set(response.totalPages);
      this.totalElements.set(response.totalElements);
      this.loading.set(false);
    });
  }

  applyFilters(): void {
    this.currentPage.set(0);
    this.loadOrders();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadOrders();
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.openMenuIndex = null;
  }

  toggleMenu(index: number, event: Event): void {
    event.stopPropagation();
    this.openMenuIndex = this.openMenuIndex === index ? null : index;
  }

  editOrder(id: number | string, event: Event): void {
    event.stopPropagation();
    this.openMenuIndex = null;
    this.router.navigate(['/admin/work-orders/edit', id]);
  }

  openDeleteModal(id: number | string, event: Event): void {
    event.stopPropagation();
    this.deleteOrderId = id;
    this.deleteReason = '';
    this.showDeleteModal.set(true);
    this.openMenuIndex = null;
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deleteOrderId = null;
  }

  confirmDelete(): void {
    if (!this.deleteOrderId || !this.deleteReason) return;
    const reason = this.deleteReason;
    this.data.deleteWorkOrder(this.deleteOrderId, reason).subscribe(() => {
      this.activity.log('Work order deleted', `Reason: ${reason}`);
      this.toast.success('Work order deleted successfully');
      this.closeDeleteModal();
      this.loadOrders();
    });
  }

  // ── Regional chart — hardcoded Peru cities ─────────────────
  regionalSeries: { name: string; data: number[] }[] = [{ name: 'Orders', data: [38, 24, 18, 14, 10] }];
  regionalChart  = { type: 'bar', height: 130, toolbar: { show: false }, background: 'transparent' } as const;
  regionalXAxis: { categories: string[]; labels: object; axisBorder: object; axisTicks: object } = {
    categories: ['Lima', 'Arequipa', 'Trujillo', 'Cusco', 'Piura'],
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
