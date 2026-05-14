import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, TechWorkOrder } from '../../../../core/services/data.service';

@Component({
  selector: 'app-tech-work-order-detail',
  imports: [RouterLink, FormsModule, TranslatePipe],
  templateUrl: './tech-work-order-detail.html',
  styleUrl: './tech-work-order-detail.scss',
})
export class TechWorkOrderDetail {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private data   = inject(DataService);

  protected saving = signal(false);

  private order$ = this.route.paramMap.pipe(
    switchMap(p => this.data.getTechWorkOrderById(p.get('id')!)),
  );

  protected order = toSignal(this.order$);

  protected techNotes   = signal('');
  protected numSensors  = signal(0);
  protected sensorType  = signal('');

  protected statusClass(status: string): string {
    return status === 'completed'  ? 'badge--completed'
      : status === 'in-progress' ? 'badge--inprogress'
      : 'badge--pending';
  }

  protected statusLabel(status: string): string {
    return status === 'completed'  ? 'Completed'
      : status === 'in-progress' ? 'In Progress'
      : 'Pending';
  }

  protected sensorStatusClass(s: string): string {
    return s === 'ok' ? 'sensor--ok' : 'sensor--maintenance';
  }

  protected toggleSensor(sensor: { id: string; location: string; status: string }): void {
    sensor.status = sensor.status === 'ok' ? 'maintenance' : 'ok';
  }

  protected startJob(): void {
    const o = this.order();
    if (!o) return;
    this.saving.set(true);
    this.data.updateTechWorkOrderStatus(o.id, 'in-progress').subscribe(() => {
      this.saving.set(false);
      this.router.navigate(['/tech/work-orders', o.id]);
    });
  }

  protected saveChanges(): void {
    const o = this.order();
    if (!o) return;
    this.saving.set(true);
    this.data.updateTechWorkOrderStatus(o.id, 'in-progress').subscribe(() => {
      this.saving.set(false);
    });
  }

  protected markCompleted(): void {
    const o = this.order();
    if (!o) return;
    this.saving.set(true);
    this.data.updateTechWorkOrderStatus(o.id, 'completed').subscribe(() => {
      this.saving.set(false);
      this.router.navigate(['/tech/work-orders']);
    });
  }

  protected typeIcon(type: string): string {
    return type === 'Installation' ? 'ph-wrench'
      : type === 'Maintenance'    ? 'ph-broadcast'
      : 'ph-database';
  }
}
