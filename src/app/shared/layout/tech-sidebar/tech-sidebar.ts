import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-tech-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './tech-sidebar.html',
  styleUrl: './tech-sidebar.scss',
})
export class TechSidebar {
  protected lang = inject(LanguageService);
  protected auth = inject(AuthService);
}
