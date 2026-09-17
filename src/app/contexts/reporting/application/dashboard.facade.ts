import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardApi } from '../infrastructure/dashboard.api';
import { DashboardStats } from '../domain/stats.model';
import { ChartData } from '../domain/chart.model';
import { ClientRadiationPoint, RadiationPoint } from '../domain/radiation-point.model';
import { LatestWorkOrder } from '../../workorder/domain/work-order.model';

/**
 * Panel y mapa del portal de administración.
 *
 * Igual que el `reporting` del backend, esto es un **read model**: no muta nada,
 * sólo proyecta. Las cifras vienen de cuatro contextos distintos pero la página no
 * tiene por qué saberlo.
 */
@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private api = inject(DashboardApi);

  stats(): Observable<DashboardStats | null> {
    return this.api.stats();
  }

  charts(): Observable<ChartData | null> {
    return this.api.chartData();
  }

  latestWorkOrders(): Observable<LatestWorkOrder[]> {
    return this.api.latestWorkOrders();
  }

  /** Un punto por lectura. */
  radiationPoints(): Observable<RadiationPoint[]> {
    return this.api.radiationMap();
  }

  /** Un marcador por cliente, con el desglose de sus sensores. */
  radiationByClient(): Observable<ClientRadiationPoint[]> {
    return this.api.radiationMapByClient();
  }
}
