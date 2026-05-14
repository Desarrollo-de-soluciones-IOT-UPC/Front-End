import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
  id: number | string;
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
  id: number | string;
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
  id: number | string;
  name: string;
  initials: string;
  joinDate: string;
  role: 'Admin' | 'Technician' | 'Client';
  email: string;
  status: 'active' | 'inactive';
}

export interface TechSensor {
  id: string;
  location: string;
  status: 'ok' | 'maintenance';
}

export interface ActivityEntry {
  event: string;
  time: string;
}

export interface ChartData {
  systemActivity: { series: number[]; categories: string[] };
  radiationTrends: { series: number[] };
  regional: { series: number[]; categories: string[] };
}

export interface TechWorkOrder {
  id: string;
  orderId: string;
  type: string;
  status: 'completed' | 'in-progress' | 'pending';
  client: string;
  location: string;
  scheduledDate: string;
  scheduledTime: string;
  technicianId: string;
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

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getStats(): Observable<DashboardStats | null> {
    return this.http.get<DashboardStats>(`${this.base}/stats`).pipe(
      catchError(() => of(null))
    );
  }

  getLatestWorkOrders(): Observable<LatestWorkOrder[]> {
    return this.http.get<LatestWorkOrder[]>(`${this.base}/latestWorkOrders`).pipe(
      catchError(() => of([]))
    );
  }

  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.base}/alerts`).pipe(
      catchError(() => of([]))
    );
  }

  getWorkOrders(): Observable<WorkOrder[]> {
    return this.http.get<WorkOrder[]>(`${this.base}/workOrders`).pipe(
      catchError(() => of([]))
    );
  }

  getHistory(): Observable<HistoryItem[]> {
    return this.http.get<HistoryItem[]>(`${this.base}/history`).pipe(
      catchError(() => of([]))
    );
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`).pipe(
      catchError(() => of([]))
    );
  }

  deleteWorkOrder(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/workOrders/${id}`).pipe(
      catchError(() => of(undefined as void))
    );
  }

  deleteUser(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`).pipe(
      catchError(() => of(undefined as void))
    );
  }

  createWorkOrder(data: Partial<WorkOrder>): Observable<WorkOrder | null> {
    return this.http.post<WorkOrder>(`${this.base}/workOrders`, data).pipe(
      catchError(() => of(null))
    );
  }

  getTechWorkOrders(): Observable<TechWorkOrder[]> {
    return this.http.get<TechWorkOrder[]>(`${this.base}/techWorkOrders`).pipe(
      catchError(() => of([]))
    );
  }

  getTechWorkOrderById(id: string): Observable<TechWorkOrder | null> {
    return this.http.get<TechWorkOrder>(`${this.base}/techWorkOrders/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  updateTechWorkOrderStatus(id: string, status: TechWorkOrder['status']): Observable<TechWorkOrder | null> {
    return this.http.patch<TechWorkOrder>(`${this.base}/techWorkOrders/${id}`, { status }).pipe(
      catchError(() => of(null))
    );
  }

  getChartData(): Observable<ChartData | null> {
    return this.http.get<ChartData>(`${this.base}/chartData`).pipe(
      catchError(() => of(null))
    );
  }
}
