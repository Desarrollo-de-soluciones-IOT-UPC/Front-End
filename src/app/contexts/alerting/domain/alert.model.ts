export type AlertType = 'danger' | 'info' | 'success' | 'warning';

/** Alerta tal como la muestra el panel de administración (sólo lectura). */
export interface Alert {
  id: number;
  type: 'danger' | 'info' | 'success';
  icon: string;
  title: string;
  description: string;
  time: string;
}

/** Alarma completa, con su ciclo de resolución (pantalla de Alarmas). */
export interface AlarmItem {
  id: number;
  type: AlertType;
  icon: string;
  title: string;
  description: string;
  time: string;
  resolved: boolean;
  resolvedAt: string | null;
  recipientType?: string;
  clientName?: string;
  sensor?: string;
}

export interface CreateAlarmPayload {
  type: AlertType;
  icon?: string;
  title: string;
  description?: string;
  recipientType?: 'all' | 'specific';
  clientIds?: number[];
  sensor?: string;
}
