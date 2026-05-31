import {
  Component, inject, signal, computed,
  OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, PLATFORM_ID, effect
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, ClientRadiationPoint, ClientDeviceReading } from '../../../../core/services/data.service';

@Component({
  selector: 'app-map-radiation',
  imports: [TranslatePipe],
  templateUrl: './map-radiation.html',
  styleUrl: './map-radiation.scss',
})
export class MapRadiation implements OnInit, AfterViewInit, OnDestroy {
  private data       = inject(DataService);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  clientPoints = signal<ClientRadiationPoint[]>([]);
  loading      = signal(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private L: any = null;
  private mapReady   = false;
  private dataLoaded = false;

  // Stats based on client max values
  safeCount    = computed(() => this.clientPoints().filter(p => p.level === 'safe').length);
  cautionCount = computed(() => this.clientPoints().filter(p => p.level === 'caution').length);
  dangerCount  = computed(() => this.clientPoints().filter(p => p.level === 'danger').length);

  // Flatten all device readings for table
  allDeviceReadings = computed(() => {
    const rows: Array<ClientDeviceReading & { clientName: string; level: string }> = [];
    for (const cp of this.clientPoints()) {
      for (const d of cp.devices) {
        rows.push({ ...d, clientName: cp.clientName, level: this.levelForValue(d.latestValue) });
      }
    }
    return rows.sort((a, b) => b.latestValue - a.latestValue);
  });

  // Table pagination
  readonly mapPageSize = 10;
  mapCurrentPage = signal(0);
  mapTotalPages  = computed(() => Math.ceil(this.allDeviceReadings().length / this.mapPageSize));
  pagedRows      = computed(() => {
    const start = this.mapCurrentPage() * this.mapPageSize;
    return this.allDeviceReadings().slice(start, start + this.mapPageSize);
  });

  mapGoToPage(page: number): void {
    if (page >= 0 && page < this.mapTotalPages()) this.mapCurrentPage.set(page);
  }

  mapPagesArray(): number[] {
    return Array.from({ length: this.mapTotalPages() }, (_, i) => i);
  }

  mapMin(a: number, b: number): number { return Math.min(a, b); }

  constructor() {
    effect(() => {
      const pts = this.clientPoints();
      if (pts.length > 0 && this.mapReady && this.L) {
        this.renderMarkers(pts);
      }
    });
  }

  ngOnInit(): void {
    this.data.getRadiationMapByClient().subscribe(list => {
      this.clientPoints.set(list);
      this.loading.set(false);
      this.dataLoaded = true;
      if (this.mapReady && this.L && list.length > 0) {
        this.renderMarkers(list);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    import('leaflet').then(L => {
      this.L = L;
      this.initMap(L);
      this.mapReady = true;
      if (this.dataLoaded && this.clientPoints().length > 0) {
        this.renderMarkers(this.clientPoints());
      }
    });
  }

  ngOnDestroy(): void {
    if (this.map) { this.map.remove(); this.map = null; }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private initMap(L: any): void {
    if (!this.mapContainer?.nativeElement) return;
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [-12.05, -77.05],
      zoom: 11,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(this.map);
  }

  private renderMarkers(pts: ClientRadiationPoint[]): void {
    if (!this.map || !this.L) return;

    this.map.eachLayer((layer: any) => {
      if (!(layer instanceof this.L.TileLayer)) this.map.removeLayer(layer);
    });

    const validPts = pts.filter(p => p.latitude && p.longitude);
    if (validPts.length === 0) return;

    validPts.forEach(cp => {
      const color = this.colorForLevel(cp.level);
      const icon  = this.L.divIcon({
        className: '',
        html: `<div style="
          width:18px; height:18px;
          border-radius:50%;
          background:${color};
          border:3px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const devRows = cp.devices
        .map(d => {
          const c = this.colorForLevel(this.levelForValue(d.latestValue));
          return `
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:5px 8px;font-size:12px;color:#374151;">${d.deviceLocation}</td>
            <td style="padding:5px 8px;font-size:12px;font-family:monospace;font-weight:700;color:${c}">
              ${d.latestValue.toFixed(3)} μSv/h
            </td>
          </tr>`;
        })
        .join('');

      const popup = `
        <div style="min-width:260px;font-family:system-ui,sans-serif;">
          <div style="font-weight:800;font-size:15px;color:#111827;margin-bottom:2px;">
            ${cp.clientName}
          </div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">${cp.location ?? ''}</div>
          <div style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;
               background:${color}22;color:${color};margin-bottom:10px;">
            Pico: ${cp.maxValue.toFixed(3)} μSv/h
          </div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;margin-bottom:6px;">
            Sensores instalados (${cp.devices.length})
          </div>
          <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:6px;overflow:hidden;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:5px 8px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;">Zona / Área</th>
                <th style="padding:5px 8px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;">Lectura</th>
              </tr>
            </thead>
            <tbody>${devRows}</tbody>
          </table>
        </div>`;

      this.L.marker([cp.latitude, cp.longitude], { icon })
        .addTo(this.map)
        .bindPopup(popup, { maxWidth: 320 });
    });

    const bounds = this.L.latLngBounds(validPts.map(p => [p.latitude, p.longitude]));
    this.map.fitBounds(bounds, { padding: [60, 60] });
  }

  levelForValue(value: number): string {
    if (value < 0.10) return 'safe';
    if (value < 0.30) return 'caution';
    return 'danger';
  }

  private colorForLevel(level: string): string {
    if (level === 'safe')    return '#16a34a';
    if (level === 'caution') return '#d97706';
    return '#dc2626';
  }

  getStatusLabelKey(level: string): string {
    return `map_${level}`;
  }

  formatValue(value: number): string { return value.toFixed(3); }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
