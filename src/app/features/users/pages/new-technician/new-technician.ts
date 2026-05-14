import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

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
export class NewTechnician {
  private fb     = inject(FormBuilder);
  private router = inject(Router);

  form = this.fb.group({
    fullName:        ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    phone:           [''],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    notes:           [''],
  }, { validators: passwordsMatch });

  submitted = false;

  showPassword = false;
  showConfirmPassword = false;

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
    this.router.navigate(['/users']);
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
