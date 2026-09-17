/**
 * Ciclo de vida de un sensor, espejo del VO `DeviceStatus` del backend.
 *
 * `unregistered` = descubierto por el edge y todavía en el pool, a la espera de que
 * un técnico lo reclame durante una instalación.
 */
export type DeviceStatus =
  | 'active'
  | 'inactive'
  | 'in-maintenance'
  | 'requires-maintenance'
  | 'collecting'
  | 'unregistered';

export function isUnregistered(status: DeviceStatus | string | undefined): boolean {
  return status === 'unregistered';
}

export function needsMaintenance(status: DeviceStatus | string | undefined): boolean {
  return status === 'requires-maintenance';
}
