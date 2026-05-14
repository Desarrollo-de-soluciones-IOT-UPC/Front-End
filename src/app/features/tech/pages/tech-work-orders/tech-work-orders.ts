import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';
import { DataService, TechWorkOrder } from '../../../../core/services/data.service';
import { AuthService } from '../../../../core/services/auth.service';

type StatusTab = 'all' | 'pending' | 'in-progress' | 'completed';

@Component({
  selector: 'app-tech-work-orders',
  imports: [RouterLink, FormsModule, TranslatePipe],
  templateUrl: './tech-work-orders.html',
  styleUrl: './tech-work-orders.scss',
})
export class TechWorkOrders {
  private data  = inject(DataService);
  private auth  = inject(AuthService);
  protected lang = inject(LanguageService);

  private allOrders = toSignal(this.data.getTechWorkOrders(), { initialValue: [] as TechWorkOrder[] });

  private techId = computed(() => this.auth.currentUser()?.technicianId ?? '');

  protected search      = signal('');
  protected activeTab   = signal<StatusTab>('all');
  protected serviceFilter = signal('all');

  protected myOrders = computed(() =>
    this.allOrders().filter(o => o.technicianId === this.techId())
  );

  protected filtered = computed(() => {
    const q    = this.search().toLowerCase();
    const tab  = this.activeTab();
    const svc  = this.serviceFilter();

    return this.myOrders().filter(o => {
      const matchSearch = !q || o.client.toLowerCase().includes(q) || o.orderId.toLowerCase().includes(q);
      const matchTab    = tab === 'all' || o.status === tab;
      const matchSvc    = svc === 'all' || o.type === svc;
      return matchSearch && matchTab && matchSvc;
    });
  });

  protected setTab(tab: StatusTab): void {
    this.activeTab.set(tab);
  }

  protected tabCount(tab: StatusTab): number {
    if (tab === 'all') return this.myOrders().length;
    return this.myOrders().filter(o => o.status === tab).length;
  }

  protected statusClass(status: string): string {
    return status === 'completed'  ? 'badge--completed'
      : status === 'in-progress' ? 'badge--inprogress'
      : 'badge--pending';
  }

  protected statusLabel(status: string): string {
    return status === 'completed'  ? 'Completed'
      : status === 'in-progress' ? 'In Progress'
      : 'Pending';
  }

  protected typeIcon(type: string): string {
    return type === 'Installation' ? 'ph-wrench'
      : type === 'Maintenance'    ? 'ph-broadcast'
      : 'ph-database';
  }

  protected priorityTask = computed(() =>
    this.myOrders().find(o => o.priority === 'High Priority' && o.status === 'pending') ?? null
  );

  protected weekProgress = computed(() => {
    const total = this.myOrders().length;
    const done  = this.myOrders().filter(o => o.status === 'completed').length;
    return { done, total };
  });
}
