import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DevicesApi } from '../infrastructure/devices.api';
import { CreateDevicePayload, Device, DiscoverableDevice } from '../domain/device.model';

@Injectable({ providedIn: 'root' })
export class DevicesFacade {
  private api = inject(DevicesApi);

  all(clientId?: number | string): Observable<Device[]> {
    return this.api.list(clientId);
  }

  ofClient(clientId: number | string): Observable<Device[]> {
    return this.api.list(clientId);
  }

  /** Sensores del pool que un técnico puede reclamar en una instalación. */
  discoverable(): Observable<DiscoverableDevice[]> {
    return this.api.discoverable();
  }

  create(payload: CreateDevicePayload): Observable<Device | null> {
    return this.api.create(payload);
  }

  update(id: number | string, payload: CreateDevicePayload): Observable<Device | null> {
    return this.api.update(id, payload);
  }

  remove(id: number | string): Observable<void> {
    return this.api.remove(id);
  }
}
