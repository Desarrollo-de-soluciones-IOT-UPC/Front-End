import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

@Injectable({ providedIn: 'root' })
export class AddressLookupService {
  private http = inject(HttpClient);

  search(query: string): Observable<AddressSuggestion[]> {
    if (!query || query.trim().length < 3) return of([]);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())}&format=json&limit=5&countrycodes=pe`;
    return this.http
      .get<AddressSuggestion[]>(url, { headers: { 'Accept-Language': 'es' } })
      .pipe(catchError(() => of([])));
  }

  reverse(lat: number, lon: number): Observable<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    return this.http
      .get<{ display_name: string }>(url, { headers: { 'Accept-Language': 'es' } })
      .pipe(
        map(r => r.display_name ?? ''),
        catchError(() => of(''))
      );
  }
}
