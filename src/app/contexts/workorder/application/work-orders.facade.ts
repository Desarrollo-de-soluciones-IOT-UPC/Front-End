import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '../../../core/http/api.client';
import { WorkOrdersApi } from '../infrastructure/work-orders.api';
import {
  CreateWorkOrderPayload, PatchTechWorkOrderBody, TechWorkOrder,
  UpdateWorkOrderPayload, WorkOrder, WorkOrderDetail,
} from '../domain/work-order.model';
import { WorkOrderStatus } from '../domain/work-order-status';

/**
 * Órdenes de trabajo para las dos audiencias: administración y parte del técnico.
 *
 * Los nombres son los del negocio (`cancel`, `mine`, `applyFieldReport`), no los del
 * transporte: cancelar una orden es un DELETE con motivo y cerrar un parte es un
 * PATCH, pero eso es asunto de la capa de infraestructura.
 */
@Injectable({ providedIn: 'root' })
export class WorkOrdersFacade {
  private api = inject(WorkOrdersApi);

  // ── Admin ──────────────────────────────────────────────────────────────────

  all(status?: string, type?: string, search?: string): Observable<WorkOrder[]> {
    return this.api.list(status, type, search);
  }

  paged(status?: string, type?: string, search?: string,
        page = 0, size = 10, sort?: string): Observable<PageResponse<WorkOrder>> {
    return this.api.paged(status, type, search, page, size, sort);
  }

  byId(id: number | string): Observable<WorkOrderDetail | null> {
    return this.api.byId(id);
  }

  detail(id: number | string): Observable<TechWorkOrder | null> {
    return this.api.detail(id);
  }

  create(payload: CreateWorkOrderPayload): Observable<WorkOrder | null> {
    return this.api.create(payload);
  }

  update(id: number | string, payload: UpdateWorkOrderPayload): Observable<WorkOrder | null> {
    return this.api.update(id, payload);
  }

  /** Lo que el admin ve como "eliminar": la orden se conserva cancelada. */
  cancel(id: number | string, reason?: string): Observable<void> {
    return this.api.cancel(id, reason);
  }

  // ── Técnico ────────────────────────────────────────────────────────────────

  /** Las órdenes asignadas al técnico del JWT. */
  mine(): Observable<TechWorkOrder[]> {
    return this.api.mine();
  }

  mineById(id: number | string): Observable<TechWorkOrder | null> {
    return this.api.mineById(id);
  }

  changeStatus(id: number | string, status: WorkOrderStatus): Observable<TechWorkOrder | null> {
    return this.api.patch(id, { status });
  }

  /** Aplica el parte de campo completo: estado, notas, sensores, evidencias... */
  applyFieldReport(id: number | string, body: PatchTechWorkOrderBody): Observable<TechWorkOrder | null> {
    return this.api.patch(id, body);
  }
}
