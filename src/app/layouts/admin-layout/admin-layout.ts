import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { Sidebar } from '../../shared/layout/sidebar/sidebar';
import { Topbar } from '../../shared/layout/topbar/topbar';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, Sidebar, Topbar, ToastComponent],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  protected layout = inject(LayoutService);
  private router = inject(Router);

  constructor() {
    // Cierra el drawer al navegar (en móvil/tablet).
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.layout.close());
  }
}
