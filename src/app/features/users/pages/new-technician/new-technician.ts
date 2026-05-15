import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService } from '../../../../core/services/data.service';
import { ToastService } from '../../../../core/services/toast.service';

function passwordsMatch(group: AbstractControl) {
  const pw  = group.get('password')?.value;
  const cpw = group.get('confirmPassword')?.value;
  return pw === cpw ? null : { mismatch: true };
}

@Component({
  selector: 'app-new-technician',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink, CommonModule],
  templateUrl: './new-technician.html',
  styleUrl: './new-technician.scss',
})
export class NewTechnician implements OnInit {
  private fb     = inject(FormBuilder);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private data   = inject(DataService);
  private toast  = inject(ToastService);

  private userId: string | null = null;
  isEditMode = signal(false);

  form = this.fb.group({
    fullName:        ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    phone:           [''],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    notes:           [''],
  }, { validators: passwordsMatch });

  submitted = false;
  saving    = signal(false);

  showPassword = false;
  showConfirmPassword = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId = id;
      this.isEditMode.set(true);
      // Password not required when editing
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('confirmPassword')?.clearValidators();
      this.form.get('confirmPassword')?.updateValueAndValidity();
      this.data.getUserById(id).subscribe(user => {
        if (!user) return;
        this.form.patchValue({
          fullName: user.name,
          email:    user.email,
          phone:    (user as any).phone ?? '',
        });
      });
    }
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(this.submitted && c && c.invalid);
  }

  get passwordMismatch(): boolean {
    return !!(this.submitted && this.form.hasError('mismatch'));
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) return;
    const v = this.form.value;
    const name = v.fullName ?? '';
    this.saving.set(true);

    if (this.userId) {
      this.data.updateUser(this.userId, {
        name,
        email: v.email ?? '',
        phone: v.phone ?? '',
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Technician updated successfully');
          this.router.navigate(['/admin/users']);
        },
        error: () => {
          this.toast.error('Failed to update technician');
          this.saving.set(false);
        },
      });
    } else {
      this.data.createUser({
        name,
        initials: name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2),
        email:    v.email    ?? '',
        password: v.password ?? '',
        role:     'TECHNICIAN',
        phone:    v.phone    ?? undefined,
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Technician created successfully');
          this.router.navigate(['/admin/users']);
        },
        error: () => {
          this.toast.error('Failed to create technician');
          this.saving.set(false);
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }
}
