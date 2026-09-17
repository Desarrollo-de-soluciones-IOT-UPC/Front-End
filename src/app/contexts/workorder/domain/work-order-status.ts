/**
 * Estado de una orden de trabajo, espejo de `WorkOrderStatus` del backend.
 *
 * `completed` y `cancelled` son estados terminales: las listas activas los excluyen
 * porque una orden cerrada vive en el historial. Esa regla la aplica el backend; aquí
 * queda expresada para que las páginas no la deduzcan con literales sueltos.
 */
export type WorkOrderStatus = 'completed' | 'in-progress' | 'pending' | 'cancelled';

export function isClosed(status: WorkOrderStatus): boolean {
  return status === 'completed' || status === 'cancelled';
}

export function isActive(status: WorkOrderStatus): boolean {
  return !isClosed(status);
}
