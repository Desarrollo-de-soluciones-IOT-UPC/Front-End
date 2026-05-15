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
  status: 'completed' | 'in-progress' | 'pending';
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
}

export interface User {
  id: number;
  name: string;
  initials: string;
  joinDate: string;
  role: 'Admin' | 'Technician' | 'Client';
  email: string;
  status: 'active' | 'inactive';
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

export interface TechWorkOrder {
  id: number;
  orderId: string;
  type: string;
  status: 'completed' | 'in-progress' | 'pending';
  client: string;
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
  activityLog: ActivityEntry[];
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
  location: string;
  city?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  technicianId?: number;
  priority?: string;
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
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  specialty?: string;
  department?: string;
  status?: string;
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

  deleteWorkOrder(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/work-orders/${id}`).pipe(
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

  getWorkOrdersPaged(status?: string, type?: string, search?: string, page = 0, size = 10): Observable<PageResponse<WorkOrder>> {
    let url = `${this.base}/work-orders/paged`;
    const params: string[] = [`page=${page}`, `size=${size}`];
    if (status) params.push(`status=${status}`);
    if (type)   params.push(`type=${type}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    url += '?' + params.join('&');
    return this.http.get<ApiResponse<PageResponse<WorkOrder>>>(url).pipe(
      map(r => r.data),
      catchError(() => of({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, last: true }))
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
    body: { status?: string; technicianNotes?: string; sensors?: { sensorId: string; location: string; status: string }[]; activityLogEntry?: { event: string; time: string } }
  ): Observable<TechWorkOrder | null> {
    return this.http.patch<ApiResponse<TechWorkOrder>>(
      `${this.base}/tech/work-orders/${id}`, body
    ).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }
}
