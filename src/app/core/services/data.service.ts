import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  private base = 'http://localhost:3000';

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/stats`);
  }

  getLatestWorkOrders(): Observable<LatestWorkOrder[]> {
    return this.http.get<LatestWorkOrder[]>(`${this.base}/latestWorkOrders`);
  }

  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.base}/alerts`);
  }

  getWorkOrders(): Observable<WorkOrder[]> {
    return this.http.get<WorkOrder[]>(`${this.base}/workOrders`);
  }

  getHistory(): Observable<HistoryItem[]> {
    return this.http.get<HistoryItem[]>(`${this.base}/history`);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }

  deleteWorkOrder(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/workOrders/${id}`);
  }

  deleteUser(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }

  createWorkOrder(data: Partial<WorkOrder>): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${this.base}/workOrders`, data);
  }
}
