import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/** Envoltorio que aplica el backend a toda respuesta (`ApiResponse<T>`). */
interface ApiEnvelope<T> { data: T; }

/** Página del backend (`PageResponse<T>`). */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export function emptyPage<T>(size = 10): PageResponse<T> {
  return { content: [], page: 0, size, totalElements: 0, totalPages: 0, last: true };
}

/** Valor de un parámetro de query; `undefined`/`null`/'' se omiten. */
type QueryValue = string | number | undefined | null;

/**
 * Único punto del front que habla HTTP con el backend.
 *
 * Concentra las tres cosas que `data.service.ts` repetía en sus 35 métodos: la URL
 * base, desenvolver `ApiResponse.data` y devolver un valor por defecto cuando la
 * llamada falla, para que las páginas nunca tengan que gestionar un error de red.
 *
 * Las APIs de cada bounded context (`contexts/&#42;/infrastructure/&#42;.api.ts`) se apoyan
 * en él; las páginas no lo ven nunca.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  /**
   * Construye la query string omitiendo lo vacío y escapando los valores.
   *
   * Antes cada método armaba su propio array de `params` a mano — seis copias del
   * mismo bucle, y sólo algunas se acordaban de `encodeURIComponent`.
   */
  static query(params: Record<string, QueryValue>): string {
    const parts = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
    return parts.length ? '?' + parts.join('&') : '';
  }

  get<T>(path: string, fallback: T): Observable<T> {
    return this.unwrap(this.http.get<ApiEnvelope<T>>(this.base + path), fallback);
  }

  post<T>(path: string, body: unknown, fallback: T): Observable<T> {
    return this.unwrap(this.http.post<ApiEnvelope<T>>(this.base + path, body), fallback);
  }

  put<T>(path: string, body: unknown, fallback: T): Observable<T> {
    return this.unwrap(this.http.put<ApiEnvelope<T>>(this.base + path, body), fallback);
  }

  patch<T>(path: string, body: unknown, fallback: T): Observable<T> {
    return this.unwrap(this.http.patch<ApiEnvelope<T>>(this.base + path, body), fallback);
  }

  /** DELETE sin cuerpo de respuesta. Nunca propaga el error, igual que antes. */
  delete(path: string): Observable<void> {
    return this.http.delete<void>(this.base + path).pipe(
      catchError(() => of(undefined as void))
    );
  }

  /** PATCH cuyo único interés es si funcionó (cambio de contraseña, por ejemplo). */
  patchOk(path: string, body: unknown): Observable<boolean> {
    return this.http.patch<void>(this.base + path, body).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private unwrap<T>(source: Observable<ApiEnvelope<T>>, fallback: T): Observable<T> {
    return source.pipe(
      map(r => r.data),
      catchError(() => of(fallback))
    );
  }
}
