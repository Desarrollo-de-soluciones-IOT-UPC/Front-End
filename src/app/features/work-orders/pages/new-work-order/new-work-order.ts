import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';
import { DataService, CreateWorkOrderPayload } from '../../../../core/services/data.service';

@Component({
  selector: 'app-new-work-order',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './new-work-order.html',
  styleUrl: './new-work-order.scss',
})
export class NewWorkOrder {
  protected lang = inject(LanguageService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private data = inject(DataService);

  submitting = false;

  technicians = toSignal(
    this.data.getUsers().pipe(
      map(users => users.filter(u => u.role === 'Technician'))
    ),
    { initialValue: [] }
  );

  form = this.fb.group({
    type:          ['', Validators.required],
    client:        ['', Validators.required],
    location:      ['', Validators.required],
    scheduledDate: [''],
    technicianId:  [null as number | null],
    priority:      ['Standard'],
  });

  get f() { return this.form.controls; }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const v = this.form.value;

    // Map display name to backend enum (INSTALLATION, MAINTENANCE, COLLECTION)
    const typeMap: Record<string, string> = {
      'Installation': 'INSTALLATION',
      'Maintenance':  'MAINTENANCE',
      'Collection':   'COLLECTION',
    };

    const payload: CreateWorkOrderPayload = {
      type:          typeMap[v.type ?? ''] ?? (v.type ?? '').toUpperCase(),
      client:        v.client ?? '',
      location:      v.location ?? '',
      scheduledDate: v.scheduledDate || undefined,
      technicianId:  v.technicianId ?? undefined,
      priority:      v.priority ?? 'Standard',
    };

    this.data.createWorkOrder(payload).subscribe({
      next: () => this.router.navigate(['/admin/work-orders']),
      error: () => { this.submitting = false; },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/work-orders']);
  }
}
