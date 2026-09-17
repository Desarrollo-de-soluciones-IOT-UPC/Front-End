import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DevicesFacade } from '../../../../contexts/device/application/devices.facade';
import { Device } from '../../../../contexts/device/domain/device.model';
import { UsersFacade } from '../../../../contexts/iam/application/users.facade';
import { User } from '../../../../contexts/iam/domain/user.model';
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
  private devicesFacade = inject(DevicesFacade);
  private usersFacade = inject(UsersFacade);
  client  = signal<User | null>(null);
  devices = signal<Device[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    this.usersFacade.byId(id).subscribe(u => {
      this.client.set(u);
      this.loading.set(false);
    });
    this.devicesFacade.all(id).subscribe(d => this.devices.set(d));
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
