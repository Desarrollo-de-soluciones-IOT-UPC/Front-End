import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, UntypedFormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

type ClientType = 'company' | 'individual';

@Component({
  selector: 'app-edit-client',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink],
  templateUrl: './edit-client.html',
  styleUrl: './edit-client.scss',
})
export class EditClient {
  private fb     = inject(FormBuilder);
  private router = inject(Router);

  clientType = signal<ClientType>('company');
  enableApp  = signal(true);
  submitted  = false;

  companyForm = this.fb.group({
    companyName: ['', Validators.required],
    taxId:       [''],
    industry:    [''],
    address:     ['', Validators.required],
    city:        ['', Validators.required],
    country:     ['United States'],
    contactName: ['', Validators.required],
    contactEmail:['', [Validators.required, Validators.email]],
    contactPhone:[''],
    numSensors:  [0, Validators.required],
    sensorType:  [''],
    accessEmail: [''],
    status:      ['active'],
    notes:       [''],
  });

  individualForm = this.fb.group({
    fullName:    ['', Validators.required],
    docId:       [''],
    address:     ['', Validators.required],
    city:        ['', Validators.required],
    country:     ['United States'],
    contactName: ['', Validators.required],
    contactEmail:['', [Validators.required, Validators.email]],
    contactPhone:[''],
    numSensors:  [0, Validators.required],
    sensorType:  [''],
    accessEmail: [''],
    status:      ['active'],
    notes:       [''],
  });

  get activeForm(): UntypedFormGroup {
    return (this.clientType() === 'company' ? this.companyForm : this.individualForm) as UntypedFormGroup;
  }

  setType(type: ClientType): void {
    this.clientType.set(type);
  }

  isInvalid(field: string): boolean {
    const c = this.activeForm.get(field);
    return !!(this.submitted && c && c.invalid);
  }

  submit(): void {
    this.submitted = true;
    if (this.activeForm.invalid) return;
    this.router.navigate(['/admin/users']);
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }
}
