import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api.client';
import { AlarmItem, Alert, CreateAlarmPayload } from '../domain/alert.model';

@Injectable({ providedIn: 'root' })
export class AlarmsApi {
  private api = inject(ApiClient);

  /** Alertas del panel (`GET /api/alerts`). */
  feed(): Observable<Alert[]> {
    return this.api.get<Alert[]>('/alerts', []);
  }

  list(): Observable<AlarmItem[]> {
    return this.api.get<AlarmItem[]>('/alarms', []);
  }

  create(payload: CreateAlarmPayload): Observable<AlarmItem | null> {
    return this.api.post<AlarmItem | null>('/alarms', payload, null);
  }

  resolve(id: number | string): Observable<AlarmItem | null> {
    return this.api.patch<AlarmItem | null>(`/alarms/${id}/resolve`, {}, null);
  }

  remove(id: number | string): Observable<void> {
    return this.api.delete(`/alarms/${id}`);
  }
}
