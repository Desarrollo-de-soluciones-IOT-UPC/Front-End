/**
 * Acta de servicio: lo que queda cuando una orden se cierra.
 *
 * Espeja el agregado `ServiceRecord` del backend. En la API la ruta sigue siendo
 * `/api/history` — el contexto se renombró por dentro, el contrato no.
 */
export interface ServiceRecord {
  id: number;
  orderId: string;
  completionDate: string;
  completionTime: string;
  client: string;
  site: string;
  serviceType: string;
  technician: string;
  technicianInitials: string;
  status: 'completed' | 'cancelled';
  workOrderId?: number;
}
