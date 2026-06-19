import { Injectable, signal, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type FontSize = 'small' | 'medium' | 'large';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  darkMode = signal(false);
  fontSize = signal<FontSize>('medium');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.darkMode.set(localStorage.getItem('emsafe_dark') === 'true');
      this.fontSize.set((localStorage.getItem('emsafe_font') as FontSize) || 'medium');
      this.applyDark(this.darkMode());
      this.applyFont(this.fontSize());
    }

    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const dark = this.darkMode();
      localStorage.setItem('emsafe_dark', String(dark));
      this.applyDark(dark);
    });

    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const size = this.fontSize();
      localStorage.setItem('emsafe_font', size);
      this.applyFont(size);
    });
  }

  toggleDarkMode(): void {
    this.darkMode.update(v => !v);
  }

  setFontSize(size: FontSize): void {
    this.fontSize.set(size);
  }

  private applyDark(dark: boolean): void {
    document.documentElement.classList.toggle('theme-dark', dark);
  }

  private applyFont(size: FontSize): void {
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
    document.documentElement.classList.add(`font-${size}`);
  }
}
