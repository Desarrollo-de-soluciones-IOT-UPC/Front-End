import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService, FontSize } from '../../../core/services/theme.service';
import { ActivityService } from '../../../core/services/activity.service';

@Component({
  selector: 'app-topbar',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  protected lang     = inject(LanguageService);
  protected auth     = inject(AuthService);
  protected theme    = inject(ThemeService);
  protected activity = inject(ActivityService);

  showBellPanel    = signal(false);
  showProfileMenu  = signal(false);

  @HostListener('document:click')
  closeAll(): void {
    this.showProfileMenu.set(false);
    this.showBellPanel.set(false);
  }

  toggleProfileMenu(e: Event): void {
    e.stopPropagation();
    const next = !this.showProfileMenu();
    this.showProfileMenu.set(next);
    if (next) this.showBellPanel.set(false);
  }

  openBell(e: Event): void {
    e.stopPropagation();
    this.showBellPanel.set(true);
    this.showProfileMenu.set(false);
  }

  closeBell(): void {
    this.showBellPanel.set(false);
  }

  setFontSize(size: FontSize, e: Event): void {
    e.stopPropagation();
    this.theme.setFontSize(size);
  }

  toggleDark(e: Event): void {
    e.stopPropagation();
    this.theme.toggleDarkMode();
  }

  get profileRoute(): string {
    return this.auth.currentUser()?.role === 'admin'
      ? '/admin/profile'
      : '/tech/profile';
  }
}
