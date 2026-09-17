import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AlarmsApi } from '../infrastructure/alarms.api';
import { AlarmItem, Alert, CreateAlarmPayload } from '../domain/alert.model';

@Injectable({ providedIn: 'root' })
export class AlarmsFacade {
  private api = inject(AlarmsApi);

  /** Alertas recientes que se pintan en el panel. */
  feed(): Observable<Alert[]> {
    return this.api.feed();
  }

  all(): Observable<AlarmItem[]> {
    return this.api.list();
  }

  create(payload: CreateAlarmPayload): Observable<AlarmItem | null> {
    return this.api.create(payload);
  }

  resolve(id: number | string): Observable<AlarmItem | null> {
    return this.api.resolve(id);
  }

  remove(id: number | string): Observable<void> {
    return this.api.remove(id);
  }
}
