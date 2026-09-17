import { Device } from '../../device/domain/device.model';
import { WorkOrderStatus } from './work-order-status';

/** Fila de la lista de órdenes (admin). */
export interface WorkOrder {
  id: number;
  orderId: string;
  type: string;
  client: string;
  location: string;
  city: string;
  date: string;
  technician: string;
  technicianInitials: string;
  status: WorkOrderStatus;
}

/** Orden en el panel "últimas órdenes" del dashboard. */
export interface LatestWorkOrder {
  id: number;
  orderId: string;
  siteLocation: string;
  technician: string;
  status: 'completed' | 'in-progress' | 'pending';
  date: string;
}

/** Lo que devuelve el backend para editar una orden. */
export interface WorkOrderDetail {
  id: number;
  orderId: string;
  type: string;
  client: string;
  clientId?: number;
  location: string;
  city?: string;
  date: string;
  technician: string;
  technicianInitials: string;
  status: WorkOrderStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  technicianId?: number;
  priority?: string;
  notes?: string;
  cancellationReason?: string;
}

export interface TechSensor {
  id: number;
  sensorId: string;
  location: string;
  status: 'ok' | 'maintenance';
}

export interface ActivityEntry {
  id: number;
  event: string;
  time: string;
}

export interface MaintenanceActionItem {
  id?: number;
  deviceId?: number | null;
  deviceName?: string;
  action: string;
  description?: string;
}

/** Vista completa de la orden: el parte del técnico y el detalle del historial. */
export interface TechWorkOrder {
  id: number;
  orderId: string;
  type: string;
  status: WorkOrderStatus;
  client: string;
  clientId?: number;
  location: string;
  scheduledDate: string;
  scheduledTime: string;
  technicianId: number;
  priority: string;
  serviceType: string;
  contactName: string;
  contactRole: string;
  contactPhone: string;
  contactEmail: string;
  accessInstructions: string;
  requiredTools: string[];
  expectedSensors: number;
  assetId: string;
  sensors: TechSensor[];
  technicianNotes: string;
  completedAt?: string;
  cancellationReason?: string;
  activityLog: ActivityEntry[];
  evidence?: string[];
  maintenanceActions?: MaintenanceActionItem[];
  clientDevices?: Device[];
}

/** Cuerpo del PATCH del ciclo de vida (estado, sensores, acciones, evidencias). */
export interface PatchTechWorkOrderBody {
  status?: string;
  technicianNotes?: string;
  cancellationReason?: string;
  sensors?: { sensorId: string; location: string; status: string }[];
  activityLogEntry?: { event: string; time: string };
  newDevices?: { name: string; type: string; serialNumber: string }[];
  /** Instalación por descubrimiento: reclamar sensores que el edge ya vio.
   *  El cliente y la ubicación los pone el backend desde la orden. */
  claimedDevices?: { deviceId?: number; serialNumber?: string; name: string; type: string }[];
  deviceUpdates?: { deviceId: number; status: string; observation?: string }[];
  maintenanceActions?: { deviceId?: number | null; deviceName?: string; action: string; description?: string }[];
  evidence?: string[];
}

export interface CreateWorkOrderPayload {
  type: string;
  client: string;
  clientId?: number;
  location: string;
  city?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  technicianId?: number;
  priority?: string;
  notes?: string;
}

export type UpdateWorkOrderPayload = Partial<CreateWorkOrderPayload>;
