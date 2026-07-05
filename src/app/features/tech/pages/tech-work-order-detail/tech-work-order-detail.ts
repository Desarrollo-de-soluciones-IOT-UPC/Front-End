import {
  Component, inject, signal, computed, effect, viewChild,
  ElementRef, OnDestroy, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, TechWorkOrder, Device, PatchTechWorkOrderBody, Reading } from '../../../../core/services/data.service';
import { RealtimeService } from '../../../../core/services/realtime.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AddressLookupService } from '../../../../core/services/address-lookup.service';

// A discovered sensor (unregistered, reporting live) the technician can claim.
interface DiscoverRow {
  deviceId: number; serialNumber: string; name: string; type: string;
  fieldUT?: number; level?: string; lastSeen?: string; claimed: boolean;
}
interface DeviceCheckRow { deviceId: number; name: string; type: string; status: string; observation: string; }
interface ActionRow { action: string; deviceId: number | null; description: string; }
interface RemovalRow { deviceId: number; name: string; type: string; removed: boolean; observation: string; }

@Component({
  selector: 'app-tech-work-order-detail',
  imports: [RouterLink, FormsModule, TranslatePipe, NgTemplateOutlet],
  templateUrl: './tech-work-order-detail.html',
  styleUrl: './tech-work-order-detail.scss',
})
export class TechWorkOrderDetail implements OnDestroy {
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private data       = inject(DataService);
  private realtime   = inject(RealtimeService);
  private toast      = inject(ToastService);
  private addrSvc    = inject(AddressLookupService);
  private platformId = inject(PLATFORM_ID);

  protected saving = signal(false);

  readonly sensorTypes = ['Sensor', 'Gateway', 'Monitor', 'Controller', 'Plug', 'Actuator'];
  readonly deviceStatuses = ['active', 'in-maintenance', 'requires-maintenance', 'collecting'];

  // Leaflet map (geocoded from the order location)
  private mapEl = viewChild<ElementRef<HTMLDivElement>>('woMapEl');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any = null;
  private mapBuiltFor: string | null = null;

  // Writable so lifecycle actions (Start Job / Complete) can update the view
  // instantly from the PATCH response — no manual refresh, no re-navigation.
  protected order = signal<TechWorkOrder | null>(null);

  // ── Editing state (in-progress) ───────────────────────────────────────────
  protected techNotes    = signal('');
  protected discoverable = signal<DiscoverRow[]>([]);
  protected deviceChecks = signal<DeviceCheckRow[]>([]);
  protected actions      = signal<ActionRow[]>([]);
  protected removals     = signal<RemovalRow[]>([]);
  protected evidence     = signal<string[]>([]);
  private initializedFor: string | null = null;

  // ── Derived client device lists ───────────────────────────────────────────
  protected clientDevices = computed<Device[]>(() => this.order()?.clientDevices ?? []);
  // Includes devices already moved to "in-maintenance" by Start Job, so the
  // maintenance checklist stays populated after the order goes in-progress.
  protected requiresMaintenanceDevices = computed<Device[]>(
    () => this.clientDevices().filter(
      d => d.status === 'requires-maintenance' || d.status === 'in-maintenance'
    )
  );

  constructor() {
    // Load the order on param change; writable signal lets actions update it live.
    this.route.paramMap.pipe(
      switchMap(p => this.data.getTechWorkOrderById(p.get('id')!)),
      takeUntilDestroyed(),
    ).subscribe(o => this.order.set(o));

    // Live discovery: sensors "appear"/update as they power on and report.
    this.realtime.discovery().pipe(takeUntilDestroyed()).subscribe(r => this.onDiscovery(r));

    effect(() => {
      const o  = this.order();
      const el = this.mapEl();
      if (!isPlatformBrowser(this.platformId)) return;
      if (o && o.location && el && this.mapBuiltFor !== `${o.id}:${o.location}`) {
        this.mapBuiltFor = `${o.id}:${o.location}`;
        this.buildMap(el.nativeElement, o.location);
      }
    });

    // Seed editing rows once, when an in-progress order is loaded.
    effect(() => {
      const o = this.order();
      if (!o) return;
      const key = `${o.id}:${o.status}`;
      if (this.initializedFor === key) return;
      this.initializedFor = key;
      this.techNotes.set(o.technicianNotes ?? '');
      if (o.status === 'in-progress') {
        if (o.type === 'Installation') {
          // Load sensors already discovered by the edge; live updates arrive via onDiscovery().
          this.data.getDiscoverableDevices().subscribe(list => {
            this.discoverable.set(list.map(d => ({
              deviceId: d.deviceId, serialNumber: d.serialNumber,
              name: this.cleanName(d.name), type: d.type || 'Sensor',
              fieldUT: d.field_uT, level: d.level, lastSeen: d.lastSeen, claimed: false,
            })));
          });
        } else if (o.type === 'Maintenance') {
          this.deviceChecks.set(this.requiresMaintenanceDevices().map(d => ({
            deviceId: d.id, name: d.name, type: d.type, status: d.status, observation: '',
          })));
        } else if (o.type === 'Collection') {
          this.removals.set(this.clientDevices().map(d => ({
            deviceId: d.id, name: d.name, type: d.type, removed: false, observation: '',
          })));
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  // ── Installation discovery ────────────────────────────────────────────────
  /** Upsert a discovered sensor when a live reading arrives over WebSocket. */
  private onDiscovery(r: Reading): void {
    const o = this.order();
    if (!o || o.status !== 'in-progress' || o.type !== 'Installation' || !r.serialNumber) return;
    this.discoverable.update(rows => {
      const idx = rows.findIndex(x => x.serialNumber === r.serialNumber);
      if (idx >= 0) {
        const copy = [...rows];
        copy[idx] = {
          ...copy[idx],
          deviceId: r.deviceDbId ?? copy[idx].deviceId,
          fieldUT: r.field_uT, level: r.level, lastSeen: r.recordedAt,
        };
        return copy;
      }
      return [...rows, {
        deviceId: r.deviceDbId ?? 0, serialNumber: r.serialNumber,
        name: '', type: 'Sensor',
        fieldUT: r.field_uT, level: r.level, lastSeen: r.recordedAt, claimed: false,
      }];
    });
  }

  /** Blank the edge's auto-generated "Unregistered sensor ..." name so the tech types a real one. */
  private cleanName(name: string): string {
    return !name || name.startsWith('Unregistered sensor') ? '' : name;
  }

  protected fmtReading(v?: number): string {
    return v === undefined || v === null ? '—' : v.toFixed(2);
  }

  /** Compact "how long ago" the sensor last reported (s / m / h). */
  protected lastSeenLabel(iso?: string): string {
    if (!iso) return '—';
    const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (secs < 60) return `${secs}s`;
    const mins = Math.round(secs / 60);
    return mins < 60 ? `${mins}m` : `${Math.round(mins / 60)}h`;
  }

  // ── Maintenance actions editing ───────────────────────────────────────────
  protected addAction(): void {
    this.actions.update(list => [...list, { action: '', deviceId: null, description: '' }]);
  }
  protected removeAction(i: number): void {
    this.actions.update(list => list.filter((_, idx) => idx !== i));
  }

  // ── Evidence upload (base64 data URLs) ────────────────────────────────────
  protected onEvidenceSelected(event: Event): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.evidence.update(list => [...list, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }
  protected removeEvidence(i: number): void {
    this.evidence.update(list => list.filter((_, idx) => idx !== i));
  }

  // ── Completion guards ─────────────────────────────────────────────────────
  protected canComplete(): boolean {
    const o = this.order();
    if (!o) return false;
    if (o.type === 'Installation') {
      const claimed = this.discoverable().filter(d => d.claimed);
      return claimed.length >= 1 && claimed.every(d => d.name.trim().length > 0 && !!d.type);
    }
    if (o.type === 'Maintenance') {
      return this.deviceChecks().length >= 1;
    }
    if (o.type === 'Collection') {
      const rows = this.removals();
      return rows.length >= 1 && rows.every(r => r.removed);
    }
    return false;
  }

  // ── Lifecycle actions ─────────────────────────────────────────────────────
  protected startJob(): void {
    const o = this.order();
    if (!o) return;
    this.saving.set(true);
    this.data.patchTechWorkOrder(o.id, {
      status: 'in-progress',
      technicianNotes: this.techNotes(),
      activityLogEntry: { event: 'Job started', time: this.now() },
    }).subscribe(updated => {
      this.saving.set(false);
      if (updated) {
        this.initializedFor = null;  // re-seed editing rows for the in-progress view
        this.order.set(updated);     // pending → in-progress reflects instantly
      } else {
        this.toast.error('Failed to start job');
      }
    });
  }

  protected markCompleted(): void {
    const o = this.order();
    if (!o || !this.canComplete()) return;
    this.saving.set(true);

    const body: PatchTechWorkOrderBody = {
      status: 'completed',
      technicianNotes: this.techNotes(),
      evidence: this.evidence(),
      activityLogEntry: { event: 'Work order completed', time: this.now() },
    };

    if (o.type === 'Installation') {
      // Claim discovered sensors: tech provides name + type; backend sets client + location.
      body.claimedDevices = this.discoverable()
        .filter(d => d.claimed)
        .map(d => ({
          deviceId: d.deviceId || undefined,
          serialNumber: d.serialNumber,
          name: d.name.trim(),
          type: d.type || 'Sensor',
        }));
    } else if (o.type === 'Maintenance') {
      body.deviceUpdates = this.deviceChecks().map(d => ({ deviceId: d.deviceId, status: d.status, observation: d.observation }));
      body.maintenanceActions = this.actions()
        .filter(a => a.action.trim())
        .map(a => ({ deviceId: a.deviceId, deviceName: this.deviceName(a.deviceId), action: a.action, description: a.description }));
    } else if (o.type === 'Collection') {
      // Collected sensors return to the pool (unregistered) so they can be re-discovered.
      body.deviceUpdates = this.removals()
        .filter(r => r.removed)
        .map(r => ({ deviceId: r.deviceId, status: 'unregistered', observation: r.observation }));
    }

    this.data.patchTechWorkOrder(o.id, body).subscribe(updated => {
      this.saving.set(false);
      if (updated) {
        this.toast.success('Work order completed');
        this.router.navigate(['/tech/work-orders']);
      } else {
        this.toast.error('Failed to complete work order');
      }
    });
  }

  private deviceName(id: number | null): string {
    if (id == null) return '';
    return this.clientDevices().find(d => d.id === id)?.name ?? '';
  }

  private now(): string {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Display helpers ───────────────────────────────────────────────────────
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

  protected deviceStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'active': 'Active',
      'in-maintenance': 'In Maintenance',
      'requires-maintenance': 'Requires Maintenance',
      'collecting': 'Collecting',
      'inactive': 'Inactive',
    };
    return map[status] ?? status;
  }

  protected initials(name: string | undefined): string {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  protected typeIcon(type: string): string {
    return type === 'Installation' ? 'ph-monitor'
      : type === 'Maintenance'    ? 'ph-wrench'
      : 'ph-package';
  }

  // ── Leaflet ───────────────────────────────────────────────────────────────
  private destroyMap(): void {
    if (this.map) { this.map.remove(); this.map = null; }
  }

  private buildMap(el: HTMLDivElement, location: string): void {
    import('leaflet').then(mod => {
      // Prod bundle exposes leaflet as { default: L }; dev as the namespace.
      const L = (mod as unknown as { default?: typeof mod }).default ?? mod;
      this.destroyMap();
      const limaCenter: [number, number] = [-12.0464, -77.0428];
      this.map = L.map(el, { center: limaCenter, zoom: 12, scrollWheelZoom: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(this.map);

      // In production CSS loads asynchronously; the container may have size 0 at
      // init → blank tiles. Recompute size once layout/CSS settles.
      [0, 200, 500].forEach(d => setTimeout(() => { if (this.map) this.map.invalidateSize(); }, d));

      this.addrSvc.search(location).subscribe(results => {
        if (!this.map || results.length === 0) return;
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        if (isNaN(lat) || isNaN(lon)) return;
        this.map.setView([lat, lon], 15);
        L.marker([lat, lon]).addTo(this.map).bindPopup(location);
      });
    });
  }
}
