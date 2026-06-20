import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { TechSidebar } from '../../shared/layout/tech-sidebar/tech-sidebar';
import { Topbar } from '../../shared/layout/topbar/topbar';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-tech-layout',
  imports: [RouterOutlet, TechSidebar, Topbar, ToastComponent],
  templateUrl: './tech-layout.html',
  styleUrl: './tech-layout.scss',
})
export class TechLayout {
  protected layout = inject(LayoutService);
  private router = inject(Router);

  constructor() {
    // Cierra el drawer al navegar (en móvil/tablet).
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.layout.close());
  }
}
