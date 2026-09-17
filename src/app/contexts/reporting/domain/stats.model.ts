/** Tarjetas de cifras del panel de administración (`GET /api/stats`). */
export interface DashboardStats {
  totalSensors: number;
  sensorsDelta: string;
  activeClients: number;
  clientsDelta: string;
  pendingTasks: number;
  tasksStatus: string;
  criticalAlerts: number;
  alertsStatus: string;
  avgCompletionHours: number;
  currentRadiationAvg: number;
  /** Umbral seguro en µT que muestra el panel (lo fija el backend). */
  safetyThreshold: number;
}
