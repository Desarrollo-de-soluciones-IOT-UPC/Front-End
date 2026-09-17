import { DeviceStatus } from './device-status';

export interface Device {
  id: number;
  name: string;
  type: string;
  location: string;
  status: DeviceStatus;
  serialNumber: string;
  installDate: string;
  createdAt: string;
  client?: string;
  clientId?: number;
  clientName?: string;
}

export interface CreateDevicePayload {
  name: string;
  type: string;
  location?: string;
  status?: string;
  serialNumber?: string;
  installDate?: string;
  clientId?: number | null;
}

/**
 * Sensor visto por el edge pero aún sin cliente: se puede reclamar durante una
 * instalación. Llega con su última lectura para que el técnico lo identifique
 * físicamente (la prueba de agitarlo).
 */
export interface DiscoverableDevice {
  deviceId: number;
  serialNumber: string;
  name: string;
  type: string;
  field_uT?: number;
  level?: string;
  lastSeen?: string;
  readingCount: number;
}
