import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';
import { Reading } from './data.service';

/**
 * Real-time telemetry over STOMP/WebSocket (backend SimpleBroker).
 *
 * The edge keeps POSTing readings over HTTP; the backend broadcasts each saved
 * reading to `/topic/readings` (all readings) and `/topic/discovery` (sensors
 * still "unregistered"). Same contract is consumed by web and mobile.
 *
 * SSR-safe: the connection is opened lazily and only in the browser
 * (`isPlatformBrowser`), like Leaflet/localStorage elsewhere in the app.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private platformId = inject(PLATFORM_ID);
  private client: Client | null = null;
  private connected = false;

  private readingsSubject  = new Subject<Reading>();
  private discoverySubject = new Subject<Reading>();

  /** Every new reading (radiation map, dashboard). */
  readings(): Observable<Reading> {
    this.ensureConnected();
    return this.readingsSubject.asObservable();
  }

  /** Updates of sensors not yet assigned to a client (installation discovery). */
  discovery(): Observable<Reading> {
    this.ensureConnected();
    return this.discoverySubject.asObservable();
  }

  private ensureConnected(): void {
    if (this.connected || !isPlatformBrowser(this.platformId)) return;
    this.connected = true;
    this.client = new Client({
      brokerURL: environment.wsUrl,
      reconnectDelay: 4000,
      onConnect: () => {
        this.client!.subscribe('/topic/readings',  m => this.emit(this.readingsSubject, m));
        this.client!.subscribe('/topic/discovery', m => this.emit(this.discoverySubject, m));
      },
    });
    this.client.activate();
  }

  private emit(subject: Subject<Reading>, message: IMessage): void {
    try {
      subject.next(JSON.parse(message.body) as Reading);
    } catch {
      /* ignore malformed frames */
    }
  }
}
