import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, PageResponse, emptyPage } from '../../../core/http/api.client';
import {
  CreateWorkOrderPayload, PatchTechWorkOrderBody, TechWorkOrder,
  UpdateWorkOrderPayload, WorkOrder, WorkOrderDetail,
} from '../domain/work-order.model';

@Injectable({ providedIn: 'root' })
export class WorkOrdersApi {
  private api = inject(ApiClient);

  // ── Admin ──────────────────────────────────────────────────────────────────

  list(status?: string, type?: string, search?: string): Observable<WorkOrder[]> {
    return this.api.get<WorkOrder[]>(
      `/work-orders${ApiClient.query({ status, type, search })}`, []);
  }

  paged(status?: string, type?: string, search?: string,
        page = 0, size = 10, sort?: string): Observable<PageResponse<WorkOrder>> {
    return this.api.get<PageResponse<WorkOrder>>(
      `/work-orders/paged${ApiClient.query({ page, size, status, type, search, sort })}`,
      emptyPage<WorkOrder>(size));
  }

  byId(id: number | string): Observable<WorkOrderDetail | null> {
    return this.api.get<WorkOrderDetail | null>(`/work-orders/${id}`, null);
  }

  /** Detalle completo de sólo lectura — lo usa la vista de detalle del historial. */
  detail(id: number | string): Observable<TechWorkOrder | null> {
    return this.api.get<TechWorkOrder | null>(`/work-orders/${id}/detail`, null);
  }

  create(payload: CreateWorkOrderPayload): Observable<WorkOrder | null> {
    return this.api.post<WorkOrder | null>('/work-orders', payload, null);
  }

  update(id: number | string, payload: UpdateWorkOrderPayload): Observable<WorkOrder | null> {
    return this.api.put<WorkOrder | null>(`/work-orders/${id}`, payload, null);
  }

  /** "Eliminar" desde el admin = cancelar (soft-cancel con motivo). */
  cancel(id: number | string, reason?: string): Observable<void> {
    return this.api.delete(`/work-orders/${id}${ApiClient.query({ reason })}`);
  }

  // ── Técnico ────────────────────────────────────────────────────────────────

  mine(): Observable<TechWorkOrder[]> {
    return this.api.get<TechWorkOrder[]>('/tech/work-orders', []);
  }

  mineById(id: number | string): Observable<TechWorkOrder | null> {
    return this.api.get<TechWorkOrder | null>(`/tech/work-orders/${id}`, null);
  }

  patch(id: number | string, body: PatchTechWorkOrderBody): Observable<TechWorkOrder | null> {
    return this.api.patch<TechWorkOrder | null>(`/tech/work-orders/${id}`, body, null);
  }
}
