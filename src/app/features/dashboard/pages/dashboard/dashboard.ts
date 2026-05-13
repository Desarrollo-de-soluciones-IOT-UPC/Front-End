import { Component } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-dashboard',
  imports: [NgApexchartsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  // System Activity (line)
  systemActivitySeries = [
    {
      name: 'Requests',
      data: [12, 28, 22, 36, 45, 38, 52, 47],
    },
  ];

  systemActivityChart = {
    type: 'line',
    height: 300,
    toolbar: { show: false },
    zoom: { enabled: false },
  } as const;

  systemActivityXAxis = {
    categories: ['01h', '05h', '09h', '13h', '17h', '21h', '23h', '24h'],
  };

  systemActivityStroke = {
    curve: 'smooth',
    width: 3,
  } as const;

  systemActivityColors = ['#39D5FF'];

  systemActivityGrid = {
    borderColor: 'rgba(255,255,255,0.06)',
    xaxis: { lines: { show: true } },
    yaxis: { lines: { show: true } },
  };

  systemActivityTooltip = {
    theme: 'dark',
  };

  // Radiation Trends (bar)
  radiationTrendsSeries = [
    {
      name: 'Avg radiation',
      data: [2.1, 2.4, 2.2, 2.8, 3.1, 2.6],
    },
  ];

  radiationTrendsChart = {
    type: 'bar',
    height: 300,
    toolbar: { show: false },
  } as const;

  radiationTrendsXAxis = {
    categories: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
  };

  radiationTrendsPlotOptions = {
    bar: {
      borderRadius: 6,
      columnWidth: '45%',
    },
  };

  radiationTrendsColors = ['#1A6EFF'];

  radiationTrendsGrid = {
    borderColor: 'rgba(255,255,255,0.06)',
  };

  radiationTrendsDataLabels = {
    enabled: false,
  };

  radiationTrendsTooltip = {
    theme: 'dark',
  };
}


