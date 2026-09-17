import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api.client';
import { CreateUserPayload, UpdateUserPayload, User, UserProfile } from '../domain/user.model';

/** Endpoints de gestión de cuentas del backend (contexto IAM). */
@Injectable({ providedIn: 'root' })
export class UsersApi {
  private api = inject(ApiClient);

  list(role?: string): Observable<User[]> {
    return this.api.get<User[]>(`/users${ApiClient.query({ role })}`, []);
  }

  byId(id: number | string): Observable<User | null> {
    return this.api.get<User | null>(`/users/${id}`, null);
  }

  create(payload: CreateUserPayload): Observable<User | null> {
    return this.api.post<User | null>('/users', payload, null);
  }

  update(id: number | string, payload: UpdateUserPayload): Observable<User | null> {
    return this.api.put<User | null>(`/users/${id}`, payload, null);
  }

  remove(id: number | string): Observable<void> {
    return this.api.delete(`/users/${id}`);
  }

  profile(): Observable<UserProfile | null> {
    return this.api.get<UserProfile | null>('/users/profile', null);
  }

  changePassword(id: number | string, currentPassword: string, newPassword: string): Observable<boolean> {
    return this.api.patchOk(`/users/${id}/password`, { currentPassword, newPassword });
  }
}
