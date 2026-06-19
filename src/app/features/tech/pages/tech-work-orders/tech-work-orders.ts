import { Component, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';
import { DataService, TechWorkOrder } from '../../../../core/services/data.service';

@Component({
  selector: 'app-tech-work-orders',
  imports: [RouterLink, FormsModule, TranslatePipe],
  templateUrl: './tech-work-orders.html',
  styleUrl: './tech-work-orders.scss',
})
export class TechWorkOrders {
  private data       = inject(DataService);
  private platformId = inject(PLATFORM_ID);
  protected lang     = inject(LanguageService);

  // Backend already filters by the logged-in technician's JWT token
  private allOrders = toSignal(this.data.getTechWorkOrders(), { initialValue: [] as TechWorkOrder[] });

  protected search        = signal('');
  protected statusFilter  = signal('all');
  protected serviceFilter = signal('all');
  // Sort: 'date' = closest scheduled date first; 'created' = newest added first
  protected sortBy        = signal('date');

  // Pagination (10 per page)
  protected currentPage = signal(0);
  protected readonly pageSize = 10;

  // Active orders only — Completed/Cancelled live exclusively in History.
  protected myOrders = computed(() =>
    this.allOrders().filter(o => o.status === 'pending' || o.status === 'in-progress')
  );

  protected filtered = computed(() => {
    const q    = this.search().toLowerCase();
    const st   = this.statusFilter();
    const svc  = this.serviceFilter();
    const sort = this.sortBy();

    const rows = this.myOrders().filter(o => {
      const matchSearch = !q || o.client.toLowerCase().includes(q) || o.orderId.toLowerCase().includes(q);
      const matchStatus = st === 'all' || o.status === st;
      const matchSvc    = svc === 'all' || o.type === svc;
      return matchSearch && matchStatus && matchSvc;
    });

    return [...rows].sort((a, b) => {
      if (sort === 'created') {
        // Newest added first — id is auto-increment, so higher = newer.
        return Number(b.id) - Number(a.id);
      }
      // Closest scheduled date first.
      return (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? '');
    });
  });

  protected totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  protected paged = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  protected onFilterChange(): void {
    this.currentPage.set(0);
  }

  protected goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) this.currentPage.set(page);
  }

  protected getPagesArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }

  protected min(a: number, b: number): number { return Math.min(a, b); }

  protected statusClass(status: string): string {
    return status === 'completed'  ? 'badge--completed'
      : status === 'in-progress' ? 'badge--inprogress'
      : status === 'cancelled'   ? 'badge--cancelled'
      : 'badge--pending';
  }

  protected statusLabel(status: string): string {
    return status === 'completed'  ? 'Completed'
      : status === 'in-progress' ? 'In Progress'
      : status === 'cancelled'   ? 'Cancelled'
      : 'Pending';
  }

  protected typeIcon(type: string): string {
    return type === 'Installation' ? 'ph-monitor'
      : type === 'Maintenance'    ? 'ph-wrench'
      : 'ph-package';
  }

  // Priority Tasks: Urgent + pending, oldest first, max 5
  protected priorityTasks = computed(() =>
    this.myOrders()
      .filter(o => (o.priority ?? '').toLowerCase() === 'urgent' && o.status === 'pending')
      .sort((a, b) => (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? ''))
      .slice(0, 5)
  );

  // Progress is measured against ALL assigned orders (incl. completed), not just
  // the active list shown in the table.
  protected weekProgress = computed(() => {
    const all   = this.allOrders();
    const total = all.length;
    const done  = all.filter(o => o.status === 'completed').length;
    return { done, total };
  });

  protected exportReport(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const rows = this.filtered();
    if (!rows.length) return;
    const headers = ['Order ID', 'Type', 'Client', 'Location', 'Date', 'Time', 'Priority', 'Status'];
    const csv = [
      headers.join(','),
      ...rows.map(o =>
        [o.orderId, o.type, o.client, o.location, o.scheduledDate, o.scheduledTime, o.priority, o.status]
          .map(v => `"${v ?? ''}"`)
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'my-work-orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
