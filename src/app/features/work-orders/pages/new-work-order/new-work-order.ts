import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';
import { DataService } from '../../../../core/services/data.service';

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
    scheduledDate: ['', Validators.required],
    technician:    ['', Validators.required],
    notes:         [''],
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

    const selected = this.technicians().find(t => t.name === v.technician);
    const newOrder = {
      orderId: `#WO-${Math.floor(Math.random() * 9000 + 1000)}`,
      type:               v.type ?? '',
      client:             v.client ?? '',
      location:           v.location ?? '',
      city:               '',
      date:               new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      technician:         v.technician ?? '',
      technicianInitials: selected ? selected.initials : '',
      status:             'pending' as const,
    };

    this.data.createWorkOrder(newOrder).subscribe({
      next: () => this.router.navigate(['/work-orders']),
      error: () => { this.submitting = false; },
    });
  }

  cancel(): void {
    this.router.navigate(['/work-orders']);
  }
}
