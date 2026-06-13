import {
  Component, inject, signal, effect, viewChild,
  ElementRef, OnDestroy, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, TechWorkOrder } from '../../../../core/services/data.service';
import { AddressLookupService } from '../../../../core/services/address-lookup.service';

@Component({
  selector: 'app-tech-work-order-detail',
  imports: [RouterLink, FormsModule, TranslatePipe],
  templateUrl: './tech-work-order-detail.html',
  styleUrl: './tech-work-order-detail.scss',
})
export class TechWorkOrderDetail implements OnDestroy {
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private data       = inject(DataService);
  private addrSvc    = inject(AddressLookupService);
  private platformId = inject(PLATFORM_ID);

  protected saving = signal(false);

  // Leaflet map for the in-progress view (geocoded from the order location)
  private mapEl = viewChild<ElementRef<HTMLDivElement>>('woMapEl');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any = null;
  private mapBuiltFor: string | null = null;

  private order$ = this.route.paramMap.pipe(
    switchMap(p => this.data.getTechWorkOrderById(p.get('id')!)),
  );

  protected order = toSignal(this.order$);

  constructor() {
    effect(() => {
      const o  = this.order();
      const el = this.mapEl();
      if (!isPlatformBrowser(this.platformId)) return;
      if (o && o.status === 'in-progress' && el && this.mapBuiltFor !== o.location) {
        this.mapBuiltFor = o.location;
        this.buildMap(el.nativeElement, o.location);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  private destroyMap(): void {
    if (this.map) { this.map.remove(); this.map = null; }
  }

  private buildMap(el: HTMLDivElement, location: string): void {
    import('leaflet').then(L => {
      this.destroyMap();
      // Lima fallback center if geocoding fails
      const limaCenter: [number, number] = [-12.0464, -77.0428];
      this.map = L.map(el, { center: limaCenter, zoom: 12, scrollWheelZoom: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(this.map);

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

  protected techNotes   = signal('');
  protected numSensors  = signal(0);
  protected sensorType  = signal('');

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

  protected sensorStatusClass(s: string): string {
    return s === 'ok' ? 'sensor--ok' : 'sensor--maintenance';
  }

  protected toggleSensor(sensor: { id: number; sensorId: string; location: string; status: string }): void {
    sensor.status = sensor.status === 'ok' ? 'maintenance' : 'ok';
  }

  protected startJob(): void {
    const o = this.order();
    if (!o) return;
    this.saving.set(true);
    this.data.patchTechWorkOrder(o.id, {
      status: 'in-progress',
      technicianNotes: this.techNotes(),
      activityLogEntry: { event: 'Job started', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
    }).subscribe(() => {
      this.saving.set(false);
      this.router.navigate(['/tech/work-orders', o.id]);
    });
  }

  protected saveChanges(): void {
    const o = this.order();
    if (!o) return;
    this.saving.set(true);
    this.data.patchTechWorkOrder(o.id, {
      status: 'in-progress',
      technicianNotes: this.techNotes(),
      sensors: o.sensors.map(s => ({ sensorId: s.sensorId, location: s.location, status: s.status })),
    }).subscribe(() => {
      this.saving.set(false);
    });
  }

  protected markCompleted(): void {
    const o = this.order();
    if (!o) return;
    this.saving.set(true);
    this.data.patchTechWorkOrder(o.id, {
      status: 'completed',
      technicianNotes: this.techNotes(),
      sensors: o.sensors.map(s => ({ sensorId: s.sensorId, location: s.location, status: s.status })),
      activityLogEntry: { event: 'Work order completed', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
    }).subscribe(() => {
      this.saving.set(false);
      this.router.navigate(['/tech/work-orders']);
    });
  }

  protected typeIcon(type: string): string {
    return type === 'Installation' ? 'ph-wrench'
      : type === 'Maintenance'    ? 'ph-broadcast'
      : 'ph-database';
  }
}
