import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { TechWorkOrder } from '../../../core/services/data.service';

/**
 * Read-only work-order detail rendered as a centered modal.
 * Shared by the Admin and Technician History detail views.
 */
@Component({
  selector: 'app-work-order-detail-modal',
  imports: [TranslatePipe],
  templateUrl: './work-order-detail-modal.html',
  styleUrl: './work-order-detail-modal.scss',
})
export class WorkOrderDetailModal {
  order = input.required<TechWorkOrder>();
  close = output<void>();

  protected statusClass(status: string): string {
    return status === 'completed'  ? 'badge--completed'
      : status === 'in-progress' ? 'badge--inprogress'
      : status === 'cancelled'   ? 'badge--cancelled'
      : 'badge--pending';
  }

  protected statusLabel(status: string): string {
    return status === 'completed'  ? 'Completed'
      : status === 'in-progress' ? 'In Progress'
      : status === 'cancelled'   ? 'Cancelled'
      : 'Pending';
  }

  protected typeIcon(type: string): string {
    return type === 'Installation' ? 'ph-monitor'
      : type === 'Maintenance'    ? 'ph-wrench'
      : 'ph-package';
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
