import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, User, Device } from '../../../../core/services/data.service';

/**
 * Read-only client profile: client data + all of its devices (any status).
 * Reached from the Devices and Users "View Client" actions.
 */
@Component({
  selector: 'app-view-client',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './view-client.html',
  styleUrl: './view-client.scss',
})
export class ViewClient implements OnInit {
  private route = inject(ActivatedRoute);
  private data  = inject(DataService);

  client  = signal<User | null>(null);
  devices = signal<Device[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    this.data.getUserById(id).subscribe(u => {
      this.client.set(u);
      this.loading.set(false);
    });
    this.data.getDevices(id).subscribe(d => this.devices.set(d));
  }

  protected deviceStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'active': 'Active',
      'in-maintenance': 'In Maintenance',
      'requires-maintenance': 'Requires Maintenance',
      'collecting': 'Collecting',
      'inactive': 'Inactive',
    };
    return map[status] ?? status;
  }

  protected initials(name: string | undefined): string {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}
