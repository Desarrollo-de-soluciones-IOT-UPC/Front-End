import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UsersApi } from '../infrastructure/users.api';
import { CreateUserPayload, UpdateUserPayload, User, UserProfile } from '../domain/user.model';

/**
 * Lo único que las páginas conocen del contexto IAM.
 *
 * Expone operaciones del negocio (`activate`, `clients`) en vez de verbos HTTP, para
 * que una pantalla no tenga que saber que "activar una cuenta" es un PUT con
 * `{ status: 'active' }`.
 */
@Injectable({ providedIn: 'root' })
export class UsersFacade {
  private api = inject(UsersApi);

  all(role?: string): Observable<User[]> {
    return this.api.list(role);
  }

  /** Los clientes, para los selectores de las órdenes de trabajo y el mapa. */
  clients(): Observable<User[]> {
    return this.api.list('Client');
  }

  technicians(): Observable<User[]> {
    return this.api.list('Technician');
  }

  byId(id: number | string): Observable<User | null> {
    return this.api.byId(id);
  }

  create(payload: CreateUserPayload): Observable<User | null> {
    return this.api.create(payload);
  }

  update(id: number | string, payload: UpdateUserPayload): Observable<User | null> {
    return this.api.update(id, payload);
  }

  /** Aprueba una cuenta creada por registro público. */
  activate(id: number | string): Observable<User | null> {
    return this.api.update(id, { status: 'active' });
  }

  remove(id: number | string): Observable<void> {
    return this.api.remove(id);
  }

  myProfile(): Observable<UserProfile | null> {
    return this.api.profile();
  }

  changePassword(id: number | string, currentPassword: string, newPassword: string): Observable<boolean> {
    return this.api.changePassword(id, currentPassword, newPassword);
  }
}
