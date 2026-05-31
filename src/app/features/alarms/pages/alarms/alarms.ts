import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, AlarmItem, User } from '../../../../core/services/data.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ActivityService } from '../../../../core/services/activity.service';

type AlarmFilter = 'all' | 'sensor' | 'system';
type ClientFilter = string; // empty = all

@Component({
  selector: 'app-alarms',
  imports: [TranslatePipe, FormsModule],
  templateUrl: './alarms.html',
  styleUrl: './alarms.scss',
})
export class Alarms implements OnInit {
  private data     = inject(DataService);
  private toast    = inject(ToastService);
  private activity = inject(ActivityService);

  alarms       = signal<AlarmItem[]>([]);
  clients      = signal<User[]>([]);
  loading      = signal(true);
  filter       = signal<AlarmFilter>('all');
  clientFilter = signal<ClientFilter>('');
  showModal    = signal(false);

  // Detail modal
  showDetail  = signal(false);
  detailAlarm = signal<AlarmItem | null>(null);

  filtered = computed(() => {
    const f   = this.filter();
    const cl  = this.clientFilter();
    let all   = this.alarms();
    if (f === 'sensor') all = all.filter(a => a.type === 'danger' || a.type === 'warning');
    if (f === 'system') all = all.filter(a => a.type === 'info'   || a.type === 'success');
    // client filter: match by alarm title containing client name (best-effort without backend relation)
    if (cl) all = all.filter(a => a.title.toLowerCase().includes(cl.toLowerCase()) || (a.description ?? '').toLowerCase().includes(cl.toLowerCase()));
    return all;
  });

  unresolvedCount = computed(() => this.alarms().filter(a => !a.resolved).length);
  resolvedCount   = computed(() => this.alarms().filter(a => a.resolved).length);

  // Modal form fields
  formTitle       = '';
  formDescription = '';
  formType: 'danger' | 'info' | 'success' | 'warning' = 'info';
  formRecipients: 'all' | 'specific' = 'all';

  ngOnInit(): void {
    this.loadAlarms();
    this.data.getUsers().subscribe(users => {
      this.clients.set(users.filter(u => u.role === 'Client'));
    });
  }

  setClientFilter(val: string): void {
    this.clientFilter.set(val);
  }

  private loadAlarms(): void {
    this.loading.set(true);
    this.data.getAlarmsCrud().subscribe(list => {
      this.alarms.set(list);
      this.loading.set(false);
    });
  }

  setFilter(f: AlarmFilter): void {
    this.filter.set(f);
  }

  openCreateModal(): void {
    this.formTitle       = '';
    this.formDescription = '';
    this.formType        = 'info';
    this.formRecipients  = 'all';
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  createAlarm(): void {
    if (!this.formTitle.trim()) {
      this.toast.error('Title is required');
      return;
    }
    this.data.createAlarm({
      type:        this.formType,
      title:       this.formTitle,
      description: this.formDescription,
      icon:        this.defaultIconForType(this.formType),
    }).subscribe(created => {
      if (created) {
        this.activity.log('Alarm created', this.formTitle);
        this.toast.success('Alarm created successfully');
        this.closeModal();
        this.loadAlarms();
      } else {
        this.toast.error('Failed to create alarm');
      }
    });
  }

  openDetail(alarm: AlarmItem): void {
    this.detailAlarm.set(alarm);
    this.showDetail.set(true);
  }

  closeDetail(): void {
    this.showDetail.set(false);
  }

  resolveAlarm(id: number | string): void {
    this.data.resolveAlarm(id).subscribe(updated => {
      if (updated) {
        this.activity.log('Alarm resolved');
        this.toast.success('Alarm resolved');
        this.showDetail.set(false);
        this.loadAlarms();
      } else {
        this.toast.error('Failed to resolve alarm');
      }
    });
  }

  deleteAlarm(id: number | string, event?: Event): void {
    if (event) event.stopPropagation();
    this.data.deleteAlarm(id).subscribe(() => {
      this.activity.log('Alarm deleted');
      this.toast.success('Alarm deleted');
      this.showDetail.set(false);
      this.loadAlarms();
    });
  }

  private defaultIconForType(type: string): string {
    const map: Record<string, string> = {
      danger:  'ph-warning-circle',
      warning: 'ph-warning',
      success: 'ph-check-circle',
      info:    'ph-info',
    };
    return map[type] ?? 'ph-bell';
  }
}
