import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';
import { DataService, TechWorkOrder } from '../../../../core/services/data.service';

const DAY_NAMES_EN  = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTH_EN = ['January','February','March','April','May','June','July',
                  'August','September','October','November','December'];

function getMondayOf(d: Date): Date {
  const day = new Date(d);
  const dow = day.getDay();
  day.setDate(day.getDate() + (dow === 0 ? -6 : 1 - dow));
  day.setHours(0, 0, 0, 0);
  return day;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth() &&
    a.getDate()     === b.getDate();
}

type ViewMode    = 'week' | 'day';
type StatusKey   = 'pending' | 'in-progress' | 'completed';
type ServiceKey  = 'Installation' | 'Maintenance' | 'Collection';

@Component({
  selector: 'app-tech-schedule',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './tech-schedule.html',
  styleUrl: './tech-schedule.scss',
})
export class TechSchedule {
  private data  = inject(DataService);
  protected lang = inject(LanguageService);

  private allOrders = toSignal(this.data.getTechWorkOrders(), { initialValue: [] as TechWorkOrder[] });

  // ── Navigation ──────────────────────────────────────────────────────────────
  private readonly _today = new Date();
  protected viewStart   = signal<Date>(getMondayOf(this._today));
  protected viewMode    = signal<ViewMode>('week');
  protected selectedDay = signal<Date>(new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate()));

  protected weekDays = computed(() => {
    const monday = this.viewStart();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  });

  protected monthLabel = computed(() => {
    const d = this.viewStart();
    return MONTH_EN[d.getMonth()] + ' ' + d.getFullYear();
  });

  protected dayNames = DAY_NAMES_EN;

  // ── Filters ──────────────────────────────────────────────────────────────────
  protected filterOpen = signal(false);

  protected statusFilters = signal<Record<StatusKey, boolean>>({
    'pending':     true,
    'in-progress': true,
    'completed':   true,
  });

  protected serviceFilters = signal<Record<ServiceKey, boolean>>({
    'Installation': true,
    'Maintenance':  true,
    'Collection':   true,
  });

  protected activeFilterCount = computed(() => {
    const sf = this.statusFilters();
    const tf = this.serviceFilters();
    const hiddenStatus  = Object.values(sf).filter(v => !v).length;
    const hiddenService = Object.values(tf).filter(v => !v).length;
    return hiddenStatus + hiddenService;
  });

  protected toggleFilterPanel(): void {
    this.filterOpen.update(v => !v);
  }

  protected toggleStatus(key: StatusKey): void {
    this.statusFilters.update(f => ({ ...f, [key]: !f[key] }));
  }

  protected toggleService(key: ServiceKey): void {
    this.serviceFilters.update(f => ({ ...f, [key]: !f[key] }));
  }

  protected resetFilters(): void {
    this.statusFilters.set({ 'pending': true, 'in-progress': true, 'completed': true });
    this.serviceFilters.set({ 'Installation': true, 'Maintenance': true, 'Collection': true });
  }

  // ── Data helpers ─────────────────────────────────────────────────────────────
  // Backend already filters work orders by the JWT token — allOrders contains only this tech's orders
  private myOrders = computed(() => this.allOrders());

  protected ordersForDay(day: Date): TechWorkOrder[] {
    const sf = this.statusFilters();
    const tf = this.serviceFilters();
    return this.myOrders().filter(o => {
      const oDate = new Date(o.scheduledDate + 'T00:00:00');
      return isSameDay(oDate, day) &&
        sf[o.status as StatusKey] &&
        tf[o.type as ServiceKey];
    });
  }

  protected ordersForSelected = computed(() =>
    this.ordersForDay(this.selectedDay())
  );

  protected priorityTask = computed(() =>
    this.myOrders().find(o => o.priority === 'High Priority' && o.status === 'pending') ?? null
  );

  protected weekProgress = computed(() => {
    const week  = this.weekDays();
    const mine  = this.myOrders().filter(o => {
      const d = new Date(o.scheduledDate + 'T00:00:00');
      return week.some(w => isSameDay(w, d));
    });
    const done  = mine.filter(o => o.status === 'completed').length;
    return { done, total: mine.length };
  });

  // ── Navigation ───────────────────────────────────────────────────────────────
  protected prevWeek(): void {
    this.viewStart.update(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return nd; });
  }

  protected nextWeek(): void {
    this.viewStart.update(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 7); return nd; });
  }

  protected today(): void {
    const t = new Date();
    this.viewStart.set(getMondayOf(t));
    this.selectedDay.set(new Date(t.getFullYear(), t.getMonth(), t.getDate()));
  }

  protected prevDay(): void {
    this.selectedDay.update(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 1); return nd; });
  }

  protected nextDay(): void {
    this.selectedDay.update(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); return nd; });
  }

  protected setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  protected selectDay(day: Date): void {
    this.selectedDay.set(new Date(day));
    this.viewMode.set('day');
  }

  protected selectedDayLabel = computed(() => {
    const d = this.selectedDay();
    return DAY_NAMES_EN[d.getDay() === 0 ? 6 : d.getDay() - 1] +
      ', ' + MONTH_EN[d.getMonth()] + ' ' + d.getDate().toString().padStart(2, '0');
  });

  // ── Styling ──────────────────────────────────────────────────────────────────
  protected isToday(day: Date): boolean {
    return isSameDay(day, new Date());
  }

  protected isSelectedDay(day: Date): boolean {
    return this.viewMode() === 'day' && isSameDay(day, this.selectedDay());
  }

  protected statusClass(status: string): string {
    return status === 'completed'  ? 'status--completed'
      : status === 'in-progress' ? 'status--inprogress'
      : 'status--pending';
  }

  protected statusLabel(status: string): string {
    return status === 'completed'  ? 'COMPLETED'
      : status === 'in-progress' ? 'IN PROGRESS'
      : 'PENDING';
  }

  protected typeIcon(type: string): string {
    return type === 'Installation' ? 'ph-wrench'
      : type === 'Maintenance'    ? 'ph-broadcast'
      : 'ph-database';
  }

  readonly statusKeys: StatusKey[]  = ['pending', 'in-progress', 'completed'];
  readonly serviceKeys: ServiceKey[] = ['Installation', 'Maintenance', 'Collection'];
}
