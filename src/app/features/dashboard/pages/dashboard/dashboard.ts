import { Component, inject } from '@angular/core';
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
export class Dashboard {
  protected lang = inject(LanguageService);
  private data = inject(DataService);

  // Data from db.json via json-server
  stats = toSignal(this.data.getStats());
  latestOrders = toSignal(this.data.getLatestWorkOrders());
  alerts = toSignal(this.data.getAlerts());

  // System Activity chart — Last 30 Days
  systemActivitySeries = [{ name: 'Work Orders', data: [5, 14, 10, 22, 18, 30, 26, 38, 32, 45, 40, 52] }];
  systemActivityChart = { type: 'line', height: 260, toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent' } as const;
  systemActivityXAxis = {
    categories: ['01 Oct', '', '', '10 Oct', '', '', '20 Oct', '', '', '', '30 Oct', ''],
    labels: { style: { colors: '#6b7280', fontSize: '12px' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  };
  systemActivityYAxis = { labels: { style: { colors: '#6b7280', fontSize: '12px' } } };
  systemActivityStroke = { curve: 'smooth', width: 2.5 } as const;
  systemActivityColors = ['#1a6eff'];
  systemActivityGrid = { borderColor: '#f0f2f5', xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } };
  systemActivityTooltip = { theme: 'light' };

  // Radiation Trends chart — green shades
  radiationTrendsSeries = [{ name: 'Avg radiation (μSv/h)', data: [0.05, 0.07, 0.06, 0.09, 0.08, 0.11, 0.13, 0.12] }];
  radiationTrendsChart = { type: 'bar', height: 200, toolbar: { show: false }, background: 'transparent' } as const;
  radiationTrendsXAxis = { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } };
  radiationTrendsPlotOptions = { bar: { borderRadius: 4, columnWidth: '60%', distributed: true } };
  radiationTrendsColors = ['#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'];
  radiationTrendsGrid = { borderColor: '#f0f2f5', yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } };
  radiationTrendsDataLabels = { enabled: false };
  radiationTrendsTooltip = { theme: 'light' };
}
