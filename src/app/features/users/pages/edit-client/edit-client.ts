import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, UntypedFormGroup } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService } from '../../../../core/services/data.service';
import { ToastService } from '../../../../core/services/toast.service';

type ClientType = 'company' | 'individual';

@Component({
  selector: 'app-edit-client',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink],
  templateUrl: './edit-client.html',
  styleUrl: './edit-client.scss',
})
export class EditClient implements OnInit {
  private fb     = inject(FormBuilder);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private data   = inject(DataService);
  private toast  = inject(ToastService);

  clientType = signal<ClientType>('company');
  enableApp  = signal(true);
  submitted  = false;
  saving     = signal(false);
  private userId: string | null = null;

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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.userId = id;
      this.data.getUserById(id).subscribe(user => {
        if (!user) return;
        const nameParts = user.name.split(' ');
        this.individualForm.patchValue({
          fullName:    user.name,
          contactEmail: user.email,
          contactPhone: '',
        });
        this.companyForm.patchValue({
          companyName:  user.name,
          contactName:  user.name,
          contactEmail: user.email,
        });
      });
    }
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
    const v = this.activeForm.value;
    this.saving.set(true);

    if (this.userId) {
      this.data.updateUser(this.userId, {
        name:   v.contactName ?? v.fullName ?? v.companyName ?? '',
        email:  v.contactEmail ?? v.accessEmail ?? '',
        phone:  v.contactPhone ?? '',
        status: v.status ?? 'active',
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Client updated successfully');
          this.router.navigate(['/admin/users']);
        },
        error: () => {
          this.toast.error('Failed to update client');
          this.saving.set(false);
        },
      });
    } else {
      const name = v.contactName ?? v.fullName ?? v.companyName ?? '';
      this.data.createUser({
        name,
        initials: name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2),
        email:    v.contactEmail ?? v.accessEmail ?? '',
        password: 'changeme123',
        role:     'CLIENT',
        phone:    v.contactPhone ?? undefined,
        location: v.city ? `${v.city}, ${v.country ?? 'US'}` : undefined,
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Client created successfully');
          this.router.navigate(['/admin/users']);
        },
        error: () => {
          this.toast.error('Failed to create client');
          this.saving.set(false);
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }
}
