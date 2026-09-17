import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '../../../core/http/api.client';
import { HistoryApi } from '../infrastructure/history.api';
import { ServiceRecord } from '../domain/service-record.model';

/**
 * Historial de actas de servicio, en sus dos ámbitos.
 *
 * El técnico ve sólo las suyas: el filtro lo aplica el backend a partir del JWT, así
 * que aquí la diferencia es únicamente qué ruta se pide.
 */
@Injectable({ providedIn: 'root' })
export class HistoryFacade {
  private api = inject(HistoryApi);

  forAdmin(status?: string, search?: string): Observable<ServiceRecord[]> {
    return this.api.list('admin', status, search);
  }

  forTechnician(status?: string, search?: string): Observable<ServiceRecord[]> {
    return this.api.list('tech', status, search);
  }

  forAdminPaged(status?: string, search?: string, page = 0, size = 10): Observable<PageResponse<ServiceRecord>> {
    return this.api.paged('admin', status, search, page, size);
  }

  forTechnicianPaged(status?: string, search?: string, page = 0, size = 10): Observable<PageResponse<ServiceRecord>> {
    return this.api.paged('tech', status, search, page, size);
  }
}
