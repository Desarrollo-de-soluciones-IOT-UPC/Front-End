/** Series de los gráficos del panel (`GET /api/chart-data`). */
export interface ChartData {
  systemActivity: { series: number[]; categories: string[] };
  radiationTrends: { series: number[] };
  regional: { series: number[]; categories: string[] };
}
