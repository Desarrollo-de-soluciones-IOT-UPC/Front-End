import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth   = inject(AuthService);
  private router = inject(Router);
  protected lang = inject(LanguageService);

  protected email       = '';
  protected password    = '';
  protected remember    = false;
  protected showPass    = signal(false);
  protected loading     = signal(false);
  protected errorMsg    = signal('');

  constructor() {
    const user = this.auth.currentUser();
    if (user?.role === 'admin')      this.router.navigate(['/admin']);
    else if (user?.role === 'technician') this.router.navigate(['/tech']);
  }

  protected togglePass(): void {
    this.showPass.update(v => !v);
  }

  protected onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMsg.set(this.lang.t('login_required'));
      return;
    }
    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.email, this.password).subscribe(ok => {
      this.loading.set(false);
      if (!ok) {
        this.errorMsg.set(this.lang.t('login_error'));
        return;
      }
      const role = this.auth.role;
      if (role === 'admin')      this.router.navigate(['/admin']);
      else if (role === 'technician') this.router.navigate(['/tech']);
    });
  }
}
