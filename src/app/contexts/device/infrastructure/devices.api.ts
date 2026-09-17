import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api.client';
import { CreateDevicePayload, Device, DiscoverableDevice } from '../domain/device.model';

@Injectable({ providedIn: 'root' })
export class DevicesApi {
  private api = inject(ApiClient);

  list(clientId?: number | string): Observable<Device[]> {
    return this.api.get<Device[]>(`/devices${ApiClient.query({ clientId })}`, []);
  }

  discoverable(): Observable<DiscoverableDevice[]> {
    return this.api.get<DiscoverableDevice[]>('/tech/devices/discoverable', []);
  }

  create(payload: CreateDevicePayload): Observable<Device | null> {
    return this.api.post<Device | null>('/devices', payload, null);
  }

  update(id: number | string, payload: CreateDevicePayload): Observable<Device | null> {
    return this.api.put<Device | null>(`/devices/${id}`, payload, null);
  }

  remove(id: number | string): Observable<void> {
    return this.api.delete(`/devices/${id}`);
  }
}
