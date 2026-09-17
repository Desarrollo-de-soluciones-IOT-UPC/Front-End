import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../../../environments/environment';
import { Reading } from '../domain/reading.model';

/**
 * Telemetría en tiempo real sobre STOMP/WebSocket (SimpleBroker del backend).
 *
 * El edge sigue enviando las lecturas por HTTP; el backend difunde cada lectura
 * guardada a `/topic/readings` (todas) y `/topic/discovery` (sensores todavía sin
 * registrar). Web y móvil consumen el mismo contrato.
 *
 * Es infraestructura de Monitoring, no un servicio transversal: los nombres de los
 * topics viven aquí y sólo aquí, igual que en el adaptador `StompReadingBroadcaster`
 * del backend.
 *
 * Seguro para SSR: la conexión se abre de forma perezosa y sólo en el navegador.
 */
@Injectable({ providedIn: 'root' })
export class ReadingsSocket {
  private platformId = inject(PLATFORM_ID);
  private client: Client | null = null;
  private connected = false;

  private readingsSubject  = new Subject<Reading>();
  private discoverySubject = new Subject<Reading>();

  /** Cada lectura nueva (mapa de radiación, panel). */
  readings(): Observable<Reading> {
    this.ensureConnected();
    return this.readingsSubject.asObservable();
  }

  /** Sensores aún sin cliente asignado (descubrimiento durante una instalación). */
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
