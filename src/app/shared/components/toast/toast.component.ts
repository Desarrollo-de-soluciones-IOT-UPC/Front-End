import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}">
          <i class="ph {{ iconFor(toast.type) }}"></i>
          <span>{{ toast.message }}</span>
          <button class="toast__close" (click)="toastService.dismiss(toast.id)">
            <i class="ph ph-x"></i>
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  protected toastService = inject(ToastService);

  protected iconFor(type: string): string {
    return type === 'success' ? 'ph-check-circle'
      : type === 'error'     ? 'ph-x-circle'
      : type === 'warning'   ? 'ph-warning'
      : 'ph-info';
  }
}
