import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api.client';
import { DashboardStats } from '../domain/stats.model';
import { ChartData } from '../domain/chart.model';
import { ClientRadiationPoint, RadiationPoint } from '../domain/radiation-point.model';
import { LatestWorkOrder } from '../../workorder/domain/work-order.model';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private api = inject(ApiClient);

  stats(): Observable<DashboardStats | null> {
    return this.api.get<DashboardStats | null>('/stats', null);
  }

  chartData(): Observable<ChartData | null> {
    return this.api.get<ChartData | null>('/chart-data', null);
  }

  latestWorkOrders(): Observable<LatestWorkOrder[]> {
    return this.api.get<LatestWorkOrder[]>('/latest-work-orders', []);
  }

  radiationMap(): Observable<RadiationPoint[]> {
    return this.api.get<RadiationPoint[]>('/radiation-map', []);
  }

  radiationMapByClient(): Observable<ClientRadiationPoint[]> {
    return this.api.get<ClientRadiationPoint[]>('/radiation-map/by-client', []);
  }
}
