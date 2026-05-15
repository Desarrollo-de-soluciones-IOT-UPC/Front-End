import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  initials: string;
  role: 'admin' | 'technician';
  technicianId?: number;
}

interface LoginResponse {
  token: string;
  email: string;
  name: string;
  initials: string;
  role: string;
  userId: number;
  technicianId: number | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const STORAGE_KEY  = 'emsafe_user';
const TOKEN_KEY    = 'emsafe_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http       = inject(HttpClient);
  private router     = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private base       = environment.apiUrl;

  private _user = signal<AuthUser | null>(this.loadFromStorage());
  readonly currentUser = this._user.asReadonly();

  get isLoggedIn(): boolean { return this._user() !== null; }
  get role(): 'admin' | 'technician' | null { return this._user()?.role ?? null; }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string) {
    return this.http.post<ApiResponse<LoginResponse>>(
      `${this.base}/auth/login`,
      { email, password }
    ).pipe(
      map(res => {
        const lr = res.data;
        const role = lr.role as 'admin' | 'technician';

        if (role !== 'admin' && role !== 'technician') return false;

        const user: AuthUser = {
          id:           lr.userId,
          email:        lr.email,
          name:         lr.name,
          initials:     lr.initials,
          role,
          technicianId: lr.technicianId ?? undefined,
        };

        this._user.set(user);
        this.saveToStorage(user, lr.token);
        return true;
      }),
      catchError(() => of(false)),
    );
  }

  logout(): void {
    this._user.set(null);
    this.clearStorage();
    this.router.navigate(['/login']);
  }

  private loadFromStorage(): AuthUser | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(user: AuthUser, token: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
  }

  private clearStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}
