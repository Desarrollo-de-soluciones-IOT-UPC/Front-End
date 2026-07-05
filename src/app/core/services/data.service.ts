import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ── Generic API response wrapper (Spring Boot backend) ───────────────────────
interface ApiResponse<T> { data: T; }

function unwrap<T>(obs: Observable<ApiResponse<T>>, fallback: T): Observable<T> {
  return obs.pipe(
    map(r => r.data),
    catchError(() => of(fallback))
  );
}

// ── Interfaces ────────────────────────────────────────────────────────────────

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
  safetyThreshold: number;
}

export interface LatestWorkOrder {
  id: number;
  orderId: string;
  siteLocation: string;
  technician: string;
  status: 'completed' | 'in-progress' | 'pending';
  date: string;
}

export interface Alert {
  id: number;
  type: 'danger' | 'info' | 'success';
  icon: string;
  title: string;
  description: string;
  time: string;
}

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
  status: 'completed' | 'in-progress' | 'pending' | 'cancelled';
}

export interface HistoryItem {
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

export interface User {
  id: number;
  name: string;
  initials: string;
  joinDate: string;
  role: 'Admin' | 'Technician' | 'Client';
  email: string;
  status: 'active' | 'inactive' | 'pending';
  phone?: string;
  location?: string;
  address?: string;
  specialty?: string;
  department?: string;
  notes?: string;
  clientType?: string;
  taxId?: string;
  industry?: string;
  country?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
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

export interface ChartData {
  systemActivity: { series: number[]; categories: string[] };
  radiationTrends: { series: number[] };
  regional: { series: number[]; categories: string[] };
}

export interface MaintenanceActionItem {
  id?: number;
  deviceId?: number | null;
  deviceName?: string;
  action: string;
  description?: string;
}

export interface TechWorkOrder {
  id: number;
  orderId: string;
  type: string;
  status: 'completed' | 'in-progress' | 'pending' | 'cancelled';
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

// Body for the technician lifecycle PATCH (status, devices, actions, evidence).
export interface PatchTechWorkOrderBody {
  status?: string;
  technicianNotes?: string;
  cancellationReason?: string;
  sensors?: { sensorId: string; location: string; status: string }[];
  activityLogEntry?: { event: string; time: string };
  newDevices?: { name: string; type: string; serialNumber: string }[];
  // Installation (discovery): claim sensors already reported by the edge.
  // Client + location are set by the backend from the work order.
  claimedDevices?: { deviceId?: number; serialNumber?: string; name: string; type: string }[];
  deviceUpdates?: { deviceId: number; status: string; observation?: string }[];
  maintenanceActions?: { deviceId?: number | null; deviceName?: string; action: string; description?: string }[];
  evidence?: string[];
}

// A live reading pushed over WebSocket (mirrors the backend ReadingDto).
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

// A sensor discovered by the edge but not yet assigned to a client.
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

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
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

export interface UpdateWorkOrderPayload {
  type?: string;
  client?: string;
  clientId?: number;
  location?: string;
  city?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  technicianId?: number;
  priority?: string;
  notes?: string;
}

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
  status: 'completed' | 'in-progress' | 'pending' | 'cancelled';
  scheduledDate?: string;
  scheduledTime?: string;
  technicianId?: number;
  priority?: string;
  notes?: string;
  cancellationReason?: string;
}

export interface HistoryDetail {
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
  notes?: string;
  priority?: string;
  scheduledDate?: string;
  location?: string;
  technicianNotes?: string;
  sensors?: { sensorId: string; location: string; status: string }[];
  cancellationReason?: string;
}

export interface CreateUserPayload {
  name: string;
  initials?: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'TECHNICIAN' | 'CLIENT';
  phone?: string;
  location?: string;
  specialty?: string;
  department?: string;
  status?: string;
  notes?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  specialty?: string;
  department?: string;
  status?: string;
  notes?: string;
  address?: string;
  clientType?: string;
  taxId?: string;
  industry?: string;
  country?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface Device {
  id: number;
  name: string;
  type: string;
  location: string;
  status: 'active' | 'inactive' | 'in-maintenance' | 'requires-maintenance' | 'collecting' | 'unregistered';
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

export interface AlarmItem {
  id: number;
  type: 'danger' | 'info' | 'success' | 'warning';
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
  type: 'danger' | 'info' | 'success' | 'warning';
  icon?: string;
  title: string;
  description?: string;
  recipientType?: 'all' | 'specific';
  clientIds?: number[];
  sensor?: string;
}

export interface RadiationPoint {
  id: number;
  latitude: number;
  longitude: number;
  location: string;
  sensorId: string;
  value: number;
  level: 'safe' | 'caution' | 'danger';
  readingDate: string;
}

export interface ClientDeviceReading {
  deviceId: number;
  deviceName: string;
  deviceType: string;
  serialNumber: string;
  deviceLocation: string;
  deviceStatus: string;
  latestValue: number;
  level: 'safe' | 'caution' | 'danger';
  readingDate: string;
}

export interface ClientRadiationPoint {
  clientId: number;
  clientName: string;
  latitude: number;
  longitude: number;
  location: string;
  maxValue: number;
  level: 'safe' | 'caution' | 'danger';
  devices: ClientDeviceReading[];
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  initials: string;
  phone: string;
  location: string;
  joinDate: string;
  status: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getStats(): Observable<DashboardStats | null> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.base}/stats`).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  getLatestWorkOrders(): Observable<LatestWorkOrder[]> {
    return unwrap(
      this.http.get<ApiResponse<LatestWorkOrder[]>>(`${this.base}/latest-work-orders`),
      []
    );
  }

  getAlerts(): Observable<Alert[]> {
    return unwrap(
      this.http.get<ApiResponse<Alert[]>>(`${this.base}/alerts`),
      []
    );
  }

  getWorkOrders(status?: string, type?: string, search?: string): Observable<WorkOrder[]> {
    let url = `${this.base}/work-orders`;
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    if (type)   params.push(`type=${type}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length) url += '?' + params.join('&');

    return unwrap(this.http.get<ApiResponse<WorkOrder[]>>(url), []);
  }

  getHistory(status?: string, search?: string): Observable<HistoryItem[]> {
    let url = `${this.base}/history`;
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length) url += '?' + params.join('&');

    return unwrap(this.http.get<ApiResponse<HistoryItem[]>>(url), []);
  }

  getUsers(role?: string): Observable<User[]> {
    const url = role
      ? `${this.base}/users?role=${role}`
      : `${this.base}/users`;
    return unwrap(this.http.get<ApiResponse<User[]>>(url), []);
  }

  deleteWorkOrder(id: number | string, reason?: string): Observable<void> {
    const url = reason
      ? `${this.base}/work-orders/${id}?reason=${encodeURIComponent(reason)}`
      : `${this.base}/work-orders/${id}`;
    return this.http.delete<void>(url).pipe(
      catchError(() => of(undefined as void))
    );
  }

  deleteUser(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`).pipe(
      catchError(() => of(undefined as void))
    );
  }

  createWorkOrder(data: CreateWorkOrderPayload): Observable<WorkOrder | null> {
    return this.http.post<ApiResponse<WorkOrder>>(`${this.base}/work-orders`, data).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  getTechWorkOrders(): Observable<TechWorkOrder[]> {
    return unwrap(
      this.http.get<ApiResponse<TechWorkOrder[]>>(`${this.base}/tech/work-orders`),
      []
    );
  }

  getTechWorkOrderById(id: string | number): Observable<TechWorkOrder | null> {
    return this.http.get<ApiResponse<TechWorkOrder>>(`${this.base}/tech/work-orders/${id}`).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  updateTechWorkOrderStatus(id: number | string, status: TechWorkOrder['status']): Observable<TechWorkOrder | null> {
    return this.http.patch<ApiResponse<TechWorkOrder>>(
      `${this.base}/tech/work-orders/${id}`,
      { status }
    ).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  getChartData(): Observable<ChartData | null> {
    return this.http.get<ApiResponse<ChartData>>(`${this.base}/chart-data`).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  getTechHistory(status?: string, search?: string): Observable<HistoryItem[]> {
    let url = `${this.base}/tech/history`;
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length) url += '?' + params.join('&');

    return unwrap(this.http.get<ApiResponse<HistoryItem[]>>(url), []);
  }

  getUserById(id: number | string): Observable<User | null> {
    return this.http.get<ApiResponse<User>>(`${this.base}/users/${id}`).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  createUser(data: CreateUserPayload): Observable<User | null> {
    return this.http.post<ApiResponse<User>>(`${this.base}/users`, data).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  updateUser(id: number | string, data: UpdateUserPayload): Observable<User | null> {
    return this.http.put<ApiResponse<User>>(`${this.base}/users/${id}`, data).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  getWorkOrdersPaged(status?: string, type?: string, search?: string, page = 0, size = 10, sort?: string): Observable<PageResponse<WorkOrder>> {
    let url = `${this.base}/work-orders/paged`;
    const params: string[] = [`page=${page}`, `size=${size}`];
    if (status) params.push(`status=${status}`);
    if (type)   params.push(`type=${type}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (sort)   params.push(`sort=${sort}`);
    url += '?' + params.join('&');
    return this.http.get<ApiResponse<PageResponse<WorkOrder>>>(url).pipe(
      map(r => r.data),
      catchError(() => of({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, last: true }))
    );
  }

  /** Full read-only work-order detail (admin) — used by the History detail view. */
  getWorkOrderDetail(id: number | string): Observable<TechWorkOrder | null> {
    return this.http.get<ApiResponse<TechWorkOrder>>(`${this.base}/work-orders/${id}/detail`).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  getHistoryPaged(status?: string, search?: string, page = 0, size = 10): Observable<PageResponse<HistoryItem>> {
    let url = `${this.base}/history/paged`;
    const params: string[] = [`page=${page}`, `size=${size}`];
    if (status) params.push(`status=${status}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    url += '?' + params.join('&');
    return this.http.get<ApiResponse<PageResponse<HistoryItem>>>(url).pipe(
      map(r => r.data),
      catchError(() => of({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, last: true }))
    );
  }

  patchTechWorkOrder(
    id: number | string,
    body: PatchTechWorkOrderBody
  ): Observable<TechWorkOrder | null> {
    return this.http.patch<ApiResponse<TechWorkOrder>>(
      `${this.base}/tech/work-orders/${id}`, body
    ).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  // ── Profile ───────────────────────────────────────────────────────────────────
  getUserProfile(): Observable<UserProfile | null> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.base}/users/profile`).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  changePassword(id: number | string, currentPassword: string, newPassword: string): Observable<boolean> {
    return this.http.patch<void>(`${this.base}/users/${id}/password`, { currentPassword, newPassword }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // ── Devices ───────────────────────────────────────────────────────────────────
  getDevices(clientId?: number | string): Observable<Device[]> {
    const url = clientId != null
      ? `${this.base}/devices?clientId=${clientId}`
      : `${this.base}/devices`;
    return unwrap(this.http.get<ApiResponse<Device[]>>(url), []);
  }

  /** Sensors discovered by the edge, not yet assigned — claimable during an installation. */
  getDiscoverableDevices(): Observable<DiscoverableDevice[]> {
    return unwrap(this.http.get<ApiResponse<DiscoverableDevice[]>>(`${this.base}/tech/devices/discoverable`), []);
  }

  createDevice(data: CreateDevicePayload): Observable<Device | null> {
    return this.http.post<ApiResponse<Device>>(`${this.base}/devices`, data).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  updateDevice(id: number | string, data: CreateDevicePayload): Observable<Device | null> {
    return this.http.put<ApiResponse<Device>>(`${this.base}/devices/${id}`, data).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  deleteDevice(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/devices/${id}`).pipe(
      catchError(() => of(undefined as void))
    );
  }

  // ── Alarms ────────────────────────────────────────────────────────────────────
  getAlarmsCrud(): Observable<AlarmItem[]> {
    return unwrap(this.http.get<ApiResponse<AlarmItem[]>>(`${this.base}/alarms`), []);
  }

  createAlarm(data: CreateAlarmPayload): Observable<AlarmItem | null> {
    return this.http.post<ApiResponse<AlarmItem>>(`${this.base}/alarms`, data).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  resolveAlarm(id: number | string): Observable<AlarmItem | null> {
    return this.http.patch<ApiResponse<AlarmItem>>(`${this.base}/alarms/${id}/resolve`, {}).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  deleteAlarm(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/alarms/${id}`).pipe(
      catchError(() => of(undefined as void))
    );
  }

  // ── Radiation Map ─────────────────────────────────────────────────────────────
  getRadiationMap(): Observable<RadiationPoint[]> {
    return unwrap(this.http.get<ApiResponse<RadiationPoint[]>>(`${this.base}/radiation-map`), []);
  }

  getRadiationMapByClient(): Observable<ClientRadiationPoint[]> {
    return unwrap(this.http.get<ApiResponse<ClientRadiationPoint[]>>(`${this.base}/radiation-map/by-client`), []);
  }

  getWorkOrderById(id: number | string): Observable<WorkOrderDetail | null> {
    return this.http.get<ApiResponse<WorkOrderDetail>>(`${this.base}/work-orders/${id}`).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  updateWorkOrder(id: number | string, data: UpdateWorkOrderPayload): Observable<WorkOrder | null> {
    return this.http.put<ApiResponse<WorkOrder>>(`${this.base}/work-orders/${id}`, data).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  cancelWorkOrder(id: number | string, reason: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/work-orders/${id}/cancel`, { reason }).pipe(
      catchError(() => of(undefined as void))
    );
  }

  getHistoryById(id: number | string): Observable<HistoryDetail | null> {
    return this.http.get<ApiResponse<HistoryDetail>>(`${this.base}/history/${id}`).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  getClients(): Observable<User[]> {
    return this.getUsers('Client');
  }

  // ── Tech History Paged ────────────────────────────────────────────────────────
  getTechHistoryPaged(status?: string, search?: string, page = 0, size = 10): Observable<PageResponse<HistoryItem>> {
    let url = `${this.base}/tech/history/paged`;
    const params: string[] = [`page=${page}`, `size=${size}`];
    if (status) params.push(`status=${status}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    url += '?' + params.join('&');
    return this.http.get<ApiResponse<PageResponse<HistoryItem>>>(url).pipe(
      map(r => r.data),
      catchError(() => of({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, last: true }))
    );
  }
}
