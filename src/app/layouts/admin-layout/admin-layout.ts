import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../../shared/layout/sidebar/sidebar';
import { Topbar } from '../../shared/layout/topbar/topbar';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, Sidebar, Topbar],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {}