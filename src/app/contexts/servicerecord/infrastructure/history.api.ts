import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, PageResponse, emptyPage } from '../../../core/http/api.client';
import { ServiceRecord } from '../domain/service-record.model';

/**
 * Historial de servicio. Las cuatro variantes (admin/técnico × plano/paginado) sólo
 * se distinguen por el prefijo de la ruta, así que se arman con un helper en vez de
 * repetir cuatro veces el mismo montaje de query string.
 */
@Injectable({ providedIn: 'root' })
export class HistoryApi {
  private api = inject(ApiClient);

  list(scope: 'admin' | 'tech', status?: string, search?: string): Observable<ServiceRecord[]> {
    return this.api.get<ServiceRecord[]>(
      `${this.root(scope)}${ApiClient.query({ status, search })}`, []);
  }

  paged(scope: 'admin' | 'tech', status?: string, search?: string,
        page = 0, size = 10): Observable<PageResponse<ServiceRecord>> {
    return this.api.get<PageResponse<ServiceRecord>>(
      `${this.root(scope)}/paged${ApiClient.query({ page, size, status, search })}`,
      emptyPage<ServiceRecord>(size));
  }

  private root(scope: 'admin' | 'tech'): string {
    return scope === 'tech' ? '/tech/history' : '/history';
  }
}
