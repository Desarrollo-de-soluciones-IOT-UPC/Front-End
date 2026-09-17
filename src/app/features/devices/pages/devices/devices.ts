import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LowerCasePipe } from '@angular/common';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DevicesFacade } from '../../../../contexts/device/application/devices.facade';
import { Device } from '../../../../contexts/device/domain/device.model';
import { UsersFacade } from '../../../../contexts/iam/application/users.facade';
import { User } from '../../../../contexts/iam/domain/user.model';
import { ToastService } from '../../../../core/services/toast.service';
import { ActivityService } from '../../../../core/services/activity.service';

type DeviceStatus = 'active' | 'inactive' | 'in-maintenance' | 'requires-maintenance' | 'collecting';

@Component({
  selector: 'app-devices',
  imports: [TranslatePipe, FormsModule, LowerCasePipe],
  templateUrl: './devices.html',
  styleUrl: './devices.scss',
})
export class Devices implements OnInit {
  private devicesFacade = inject(DevicesFacade);
  private usersFacade = inject(UsersFacade);
  private toast    = inject(ToastService);
  private activity = inject(ActivityService);
  private router   = inject(Router);

  devices       = signal<Device[]>([]);
  clients       = signal<User[]>([]);
  loading       = signal(true);
  showModal     = signal(false);
  editingDevice = signal<Device | null>(null);

  // Delete confirm modal
  showDeleteModal  = signal(false);
  deleteDeviceId   = signal<number | string | null>(null);

  // 3-dot menu
  openMenuId = signal<number | string | null>(null);

  // Filters
  searchQuery    = signal('');
  filterType     = signal('all');
  filterStatus   = signal('all');

  // Pagination
  readonly pageSize = 10;
  currentPage = signal(0);

  // Canonical device types
  readonly deviceTypes = ['Sensor', 'Gateway', 'Monitor', 'Controller', 'Plug', 'Actuator'];

  // Modal form fields
  formName        = '';
  formType        = 'Sensor';
  formClient      = '';
  formLocation    = '';
  formStatus: DeviceStatus = 'active';
  formSerial      = '';
  formInstallDate = '';

  // Computed filtered list
  filtered = computed(() => {
    const q   = this.searchQuery().toLowerCase();
    const ty  = this.filterType();
    const st  = this.filterStatus();
    return this.devices().filter(d => {
      const matchQ  = !q || d.name.toLowerCase().includes(q) || (d.serialNumber ?? '').toLowerCase().includes(q);
      const matchTy = ty === 'all' || d.type === ty;
      const matchSt = st === 'all' || d.status === st;
      return matchQ && matchTy && matchSt;
    });
  });

  totalPages  = computed(() => Math.ceil(this.filtered().length / this.pageSize));
  pagedItems  = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  // Unique types for the filter dropdown
  uniqueTypes   = computed(() => [...new Set(this.devices().map(d => d.type))]);

  pagesArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  ngOnInit(): void {
    this.loadDevices();
    this.usersFacade.all().subscribe(users => {
      this.clients.set(users.filter(u => u.role === 'Client'));
    });
  }

  private loadDevices(): void {
    this.loading.set(true);
    this.devicesFacade.all().subscribe(list => {
      this.devices.set(list);
      this.loading.set(false);
    });
  }

  onSearchChange(): void {
    this.currentPage.set(0);
  }

  onFilterChange(): void {
    this.currentPage.set(0);
  }

  // 3-dot menu
  toggleMenu(id: number | string, event: Event): void {
    event.stopPropagation();
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  @HostListener('document:click')
  closeAllMenus(): void {
    this.openMenuId.set(null);
  }

  openCreate(): void {
    this.editingDevice.set(null);
    this.formName        = '';
    this.formType        = 'Sensor';
    this.formClient      = '';
    this.formLocation    = '';
    this.formStatus      = 'active';
    this.formSerial      = '';
    this.formInstallDate = '';
    this.openMenuId.set(null);
    this.showModal.set(true);
  }

  openEdit(d: Device): void {
    this.editingDevice.set(d);
    this.formName        = d.name;
    this.formType        = d.type;
    this.formClient      = d.clientName ?? d.client ?? '';
    this.formLocation    = d.location;
    this.formStatus      = d.status as DeviceStatus;
    this.formSerial      = d.serialNumber;
    this.formInstallDate = d.installDate ?? '';
    this.openMenuId.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveDevice(): void {
    const selectedClient = this.clients().find(c => c.name === this.formClient);
    const payload = {
      name:         this.formName,
      type:         this.formType,
      location:     this.formLocation,
      status:       this.formStatus,
      serialNumber: this.formSerial,
      installDate:  this.formInstallDate,
      clientId:     selectedClient ? selectedClient.id : null,
    };

    const editing = this.editingDevice();
    if (editing) {
      this.devicesFacade.update(editing.id, payload).subscribe(updated => {
        if (updated) {
          this.activity.log('Device updated', this.formName);
          this.toast.success('Device updated successfully');
          this.closeModal();
          this.loadDevices();
        } else {
          this.toast.error('Failed to update device');
        }
      });
    } else {
      this.devicesFacade.create(payload).subscribe(created => {
        if (created) {
          this.activity.log('Device created', this.formName);
          this.toast.success('Device created successfully');
          this.closeModal();
          this.loadDevices();
        } else {
          this.toast.error('Failed to create device');
        }
      });
    }
  }

  openDeleteConfirm(id: number | string): void {
    this.deleteDeviceId.set(id);
    this.showDeleteModal.set(true);
    this.openMenuId.set(null);
  }

  closeDeleteConfirm(): void {
    this.showDeleteModal.set(false);
    this.deleteDeviceId.set(null);
  }

  confirmDelete(): void {
    const id = this.deleteDeviceId();
    if (id == null) return;
    this.devicesFacade.remove(id).subscribe(() => {
      this.activity.log('Device deleted');
      this.toast.success('Device deleted');
      this.closeDeleteConfirm();
      this.loadDevices();
    });
  }

  viewClient(device: Device): void {
    this.openMenuId.set(null);
    if (device.clientId == null) {
      this.toast.error('This device has no associated client');
      return;
    }
    this.router.navigate(['/admin/users/view-client', device.clientId]);
  }

  createWorkOrder(device: Device): void {
    this.openMenuId.set(null);
    // Pre-fill a Maintenance work order for the device's associated client,
    // using the client's registered site as the location.
    const client = this.clients().find(c => c.id === device.clientId);
    const location = client?.address ?? client?.location ?? device.location ?? '';
    this.router.navigate(['/admin/work-orders/new'], {
      queryParams: {
        type: 'Maintenance',
        clientId: device.clientId ?? '',
        location,
      },
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      'active':               'active',
      'inactive':             'inactive',
      'in-maintenance':       'in-maintenance',
      'requires-maintenance': 'requires-maintenance',
      'collecting':           'collecting',
    };
    return map[status] ?? 'inactive';
  }

  statusKey(status: string): string {
    const map: Record<string, string> = {
      'active':               'dev_active',
      'inactive':             'dev_inactive',
      'in-maintenance':       'dev_inMaintenance',
      'requires-maintenance': 'dev_requiresMaintenance',
      'collecting':           'dev_collecting',
    };
    return map[status] ?? 'dev_inactive';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
