import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, UserProfile } from '../../../../core/services/data.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  imports: [TranslatePipe, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private data    = inject(DataService);
  private auth    = inject(AuthService);
  private toast   = inject(ToastService);

  profile  = signal<UserProfile | null>(null);
  loading  = signal(true);
  saving   = signal(false);
  changingPw = signal(false);

  // Personal info form fields
  editName     = '';
  editPhone    = '';
  editLocation = '';

  // Password form fields
  currentPassword    = '';
  newPassword        = '';
  confirmNewPassword = '';

  ngOnInit(): void {
    this.data.getUserProfile().subscribe(p => {
      this.profile.set(p);
      if (p) {
        this.editName     = p.name     ?? '';
        this.editPhone    = p.phone    ?? '';
        this.editLocation = p.location ?? '';
      }
      this.loading.set(false);
    });
  }

  saveProfile(): void {
    const p = this.profile();
    if (!p) return;
    this.saving.set(true);
    this.data.updateUser(p.id, {
      name:     this.editName,
      phone:    this.editPhone,
      location: this.editLocation,
    }).subscribe(updated => {
      this.saving.set(false);
      if (updated) {
        this.profile.set({ ...p, name: this.editName, phone: this.editPhone, location: this.editLocation });
        this.toast.success('Profile updated successfully');
      } else {
        this.toast.error('Failed to update profile');
      }
    });
  }

  changePassword(): void {
    if (this.newPassword !== this.confirmNewPassword) {
      this.toast.error('New passwords do not match');
      return;
    }
    if (!this.newPassword || this.newPassword.length < 6) {
      this.toast.error('Password must be at least 6 characters');
      return;
    }
    const p = this.profile();
    if (!p) return;
    this.changingPw.set(true);
    this.data.changePassword(p.id, this.currentPassword, this.newPassword).subscribe(ok => {
      this.changingPw.set(false);
      if (ok) {
        this.currentPassword    = '';
        this.newPassword        = '';
        this.confirmNewPassword = '';
        this.toast.success('Password changed successfully');
      } else {
        this.toast.error('Failed to change password. Check your current password.');
      }
    });
  }

  formatJoinDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
}
