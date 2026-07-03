import { Injectable, signal } from '@angular/core';

/**
 * Coordina el estado del menú lateral (drawer) en pantallas tablet/móvil.
 * El sidebar y el topbar son componentes hermanos dentro del layout, así que
 * comparten este servicio para abrir/cerrar el menú hamburguesa.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  /** true → el drawer está abierto (solo aplica en ≤1024px). */
  readonly sidebarOpen = signal(false);

  toggle(): void {
    this.sidebarOpen.update((v) => !v);
  }

  open(): void {
    this.sidebarOpen.set(true);
  }

  close(): void {
    this.sidebarOpen.set(false);
  }
}
