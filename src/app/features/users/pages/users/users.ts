import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, User } from '../../../../core/services/data.service';

type RoleFilter = 'all' | 'Admin' | 'Technician' | 'Client';

@Component({
  selector: 'app-users',
  imports: [TranslatePipe, RouterLink, DecimalPipe],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  private data   = inject(DataService);
  private router = inject(Router);

  private _allUsers = signal<User[]>([]);
  searchQuery  = signal('');
  activeTab    = signal<RoleFilter>('all');
  openMenuId: number | string | null = null;
  showAddModal = signal(false);

  filteredUsers = computed(() => {
    let list = this._allUsers();
    const tab = this.activeTab();
    const q   = this.searchQuery().toLowerCase().trim();

    if (tab !== 'all') {
      list = list.filter(u => u.role === tab);
    }
    if (q) {
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return list;
  });

  totalUsers   = computed(() => this._allUsers().length);
  activeNow    = computed(() => this._allUsers().filter(u => u.status === 'active').length);
  pendingCount = computed(() => this._allUsers().filter(u => u.status === 'inactive').length);

  ngOnInit(): void {
    this.data.getUsers().subscribe(users => this._allUsers.set(users));
  }

  setTab(tab: RoleFilter): void {
    this.activeTab.set(tab);
  }

  openAdd(): void {
    this.showAddModal.set(true);
  }

  closeAdd(): void {
    this.showAddModal.set(false);
  }

  addUser(type: 'Admin' | 'Technician' | 'Client'): void {
    this.showAddModal.set(false);
    const routes: Record<string, string> = {
      Admin:      '/admin/users/new-admin',
      Technician: '/admin/users/new-technician',
      Client:     '/admin/users/edit-client/new',
    };
    this.router.navigate([routes[type]]);
  }

  editUser(user: User): void {
    this.openMenuId = null;
    const routes: Record<string, string> = {
      Admin:      `/admin/users/edit-admin/${user.id}`,
      Technician: `/admin/users/edit-technician/${user.id}`,
      Client:     `/admin/users/edit-client/${user.id}`,
    };
    this.router.navigate([routes[user.role]]);
  }

  toggleMenu(id: string | number, event: Event): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.openMenuId = null;
  }

  deleteUser(id: number | string, event: Event): void {
    event.stopPropagation();
    this.data.deleteUser(id).subscribe(() => {
      this._allUsers.update(list => list.filter(u => String(u.id) !== String(id)));
    });
    this.openMenuId = null;
  }

  formatJoinDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}
