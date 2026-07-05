import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../../core/services/data.service';
import { LanguageService } from '../../../../core/services/language.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-dashboard',
  imports: [NgApexchartsModule, TranslatePipe, DecimalPipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  protected lang = inject(LanguageService);
  private data = inject(DataService);
  private platformId = inject(PLATFORM_ID);

  stats = toSignal(this.data.getStats());
  latestOrders = toSignal(this.data.getLatestWorkOrders());
  alerts = toSignal(this.data.getAlerts());

  // Charts only render once data has loaded — fixes blank charts when
  // navigating back to the dashboard (the chart mounts with data present).
  protected chartsReady = signal(false);

  // Service History chart — grouped bar (3 series)
  serviceHistorySeries: { name: string; data: number[] }[] = [
    { name: 'Installation', data: [] },
    { name: 'Maintenance',  data: [] },
    { name: 'Collection',   data: [] },
  ];
  serviceHistoryChart = { type: 'bar', height: 360, toolbar: { show: false }, background: 'transparent' } as const;
  serviceHistoryXAxis: { categories: string[]; labels: object; axisBorder: object; axisTicks: object } = {
    categories: [],
    labels: { style: { colors: '#6b7280', fontSize: '11px' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  };
  serviceHistoryYAxis = { labels: { style: { colors: '#6b7280', fontSize: '12px' } } };
  serviceHistoryPlotOptions = { bar: { borderRadius: 3, columnWidth: '65%', grouped: true } };
  serviceHistoryColors = ['#1a6eff', '#d97706', '#16a34a'];
  serviceHistoryGrid = { borderColor: '#f0f2f5', xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } };
  serviceHistoryDataLabels = { enabled: false };
  serviceHistoryTooltip = { theme: 'light' };
  serviceHistoryLegend = { position: 'top', horizontalAlign: 'right', fontSize: '12px' } as const;

  // Radiation Trends chart — smooth area
  radiationTrendsSeries: { name: string; data: number[] }[] = [{ name: 'µT', data: [] }];
  radiationTrendsChart = {
    type: 'area',
    height: 260,
    toolbar: { show: false },
    background: 'transparent',
    zoom: { enabled: false },
    selection: { enabled: false },
    animations: { enabled: false },
  } as const;
  radiationTrendsXAxis = { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } };
  radiationTrendsYAxis = {
    labels: {
      style: { colors: '#6b7280', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" },
      formatter: (v: number) => v.toFixed(0),
    },
    tickAmount: 4,
  };
  radiationTrendsStroke = { curve: 'smooth' as const, width: 2 };
  radiationTrendsFill = {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 100] },
  };
  radiationTrendsColors = ['#16a34a'];
  radiationTrendsGrid = { borderColor: '#f0f2f5', yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } };
  radiationTrendsDataLabels = { enabled: false };
  radiationTrendsTooltip = {
    theme: 'light',
    y: { formatter: (v: number) => `${v.toFixed(1)} µT` },
  };
  radiationTrendsMarkers = { size: 0 };

  ngOnInit(): void {
    this.data.getChartData().subscribe(c => {
      if (!c) return;
      // Split single series into 3 proportionally: 45% install, 35% maint, 20% collect
      const base = c.systemActivity.series;
      this.serviceHistorySeries = [
        { name: 'Installation', data: base.map(v => Math.round(v * 0.45)) },
        { name: 'Maintenance',  data: base.map(v => Math.round(v * 0.35)) },
        { name: 'Collection',   data: base.map(v => Math.round(v * 0.20)) },
      ];
      this.serviceHistoryXAxis = { ...this.serviceHistoryXAxis, categories: c.systemActivity.categories };
      this.radiationTrendsSeries = [{ name: 'Avg radiation (µT)', data: c.radiationTrends.series }];
      this.chartsReady.set(true);
    });
  }

  // Exports the Work Orders History (the 'History' section), not the live orders.
  exportReport(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.data.getHistory().subscribe(records => {
      if (!records.length) return;
      const headers = ['Order ID', 'Completion Date', 'Completion Time', 'Client', 'Site', 'Service Type', 'Technician', 'Status'];
      const csv = [
        headers.join(','),
        ...records.map(h =>
          [h.orderId, h.completionDate, h.completionTime, h.client, h.site, h.serviceType, h.technician, h.status]
            .map(v => `"${v ?? ''}"`)
            .join(',')
        ),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'work-orders-history.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
