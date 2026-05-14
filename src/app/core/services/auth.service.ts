import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  initials: string;
  role: 'admin' | 'technician';
  technicianId?: string;
}

interface Credential extends AuthUser {
  password: string;
}

const STORAGE_KEY = 'emsafe_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http         = inject(HttpClient);
  private router       = inject(Router);
  private platformId   = inject(PLATFORM_ID);
  private base         = 'http://localhost:3000';

  private _user = signal<AuthUser | null>(this.loadFromStorage());
  readonly currentUser = this._user.asReadonly();

  get isLoggedIn(): boolean { return this._user() !== null; }
  get role(): 'admin' | 'technician' | null { return this._user()?.role ?? null; }

  login(email: string, password: string) {
    return this.http.get<Credential[]>(`${this.base}/credentials`).pipe(
      map(list => {
        const found = list.find(u => u.email === email && u.password === password);
        if (!found) return false;
        const { password: _pw, ...user } = found;
        this._user.set(user);
        this.saveToStorage(user);
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

  private saveToStorage(user: AuthUser): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  private clearStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(STORAGE_KEY);
  }
}
