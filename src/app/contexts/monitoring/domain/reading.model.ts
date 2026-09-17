/** Una lectura de telemetría, tal como la publica el backend (`ReadingDto`). */
export interface Reading {
  id?: number;
  serialNumber: string;
  deviceDbId?: number;
  deviceName?: string;
  field_uT?: number;
  level?: string;
  message?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  clientId?: number;
  clientName?: string;
  recordedAt?: string;
}
