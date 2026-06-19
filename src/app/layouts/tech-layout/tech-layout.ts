import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TechSidebar } from '../../shared/layout/tech-sidebar/tech-sidebar';
import { Topbar } from '../../shared/layout/topbar/topbar';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-tech-layout',
  imports: [RouterOutlet, TechSidebar, Topbar, ToastComponent],
  templateUrl: './tech-layout.html',
  styleUrl: './tech-layout.scss',
})
export class TechLayout {}
