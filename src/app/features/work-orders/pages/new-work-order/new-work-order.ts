import {
  Component, inject, signal, OnInit, OnDestroy,
  PLATFORM_ID, ViewChild, ElementRef
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService, CreateWorkOrderPayload, UpdateWorkOrderPayload, User } from '../../../../core/services/data.service';
import { AddressLookupService, AddressSuggestion } from '../../../../core/services/address-lookup.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-new-work-order',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './new-work-order.html',
  styleUrl: './new-work-order.scss',
})
export class NewWorkOrder implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private router     = inject(Router);
  private route      = inject(ActivatedRoute);
  private data       = inject(DataService);
  private addrSvc    = inject(AddressLookupService);
  private activity   = inject(ActivityService);
  private toast      = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('mapPickerEl') mapPickerEl?: ElementRef<HTMLDivElement>;

  isEditMode  = signal(false);
  editId: number | string | null = null;
  submitting  = false;

  technicians = signal<User[]>([]);
  clients     = signal<User[]>([]);

  // Address autocomplete
  addressSuggestions = signal<AddressSuggestion[]>([]);
  showSuggestions    = signal(false);
  private addrInput$ = new Subject<string>();

  // Map picker
  showMapPicker   = signal(false);
  mapPickedAddr   = signal('');
  mapPickedLat    = signal<number | null>(null);
  mapPickedLon    = signal<number | null>(null);
  mapPickerLoading = signal(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pickerMap: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pickerL: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pickerMarker: any = null;

  form = this.fb.group({
    type:          ['', Validators.required],
    clientId:      [null as number | null, Validators.required],
    location:      ['', Validators.required],
    scheduledDate: ['', Validators.required],
    scheduledTime: [''],
    technicianId:  [null as number | null],
    priority:      ['Standard'],
    notes:         [''],
  });

  get f() { return this.form.controls; }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  ngOnInit(): void {
    this.data.getUsers().subscribe(users => {
      this.technicians.set(users.filter(u => u.role === 'Technician'));
      this.clients.set(users.filter(u => u.role === 'Client'));
    });

    if (isPlatformBrowser(this.platformId)) {
      this.addrInput$.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(q => this.addrSvc.search(q))
      ).subscribe(results => {
        this.addressSuggestions.set(results);
        this.showSuggestions.set(results.length > 0);
      });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.editId = id;
      this.data.getWorkOrderById(id).subscribe(wo => {
        if (!wo) return;
        const client = this.clients().find(c => c.name === wo.client);
        this.form.patchValue({
          type:          wo.type,
          clientId:      client?.id ?? null,
          location:      wo.location,
          scheduledDate: wo.scheduledDate ?? '',
          scheduledTime: wo.scheduledTime ?? '',
          technicianId:  wo.technicianId ?? null,
          priority:      wo.priority ?? 'Standard',
          notes:         wo.notes ?? '',
        });
      });
    }
  }

  ngOnDestroy(): void {
    this.destroyPickerMap();
  }

  // ── Address autocomplete ───────────────────────────
  onAddressInput(value: string): void {
    this.form.controls.location.setValue(value);
    this.addrInput$.next(value);
  }

  selectAddress(suggestion: AddressSuggestion): void {
    const name = suggestion.display_name.split(',').slice(0, 3).join(',').trim();
    this.form.controls.location.setValue(name);
    this.addressSuggestions.set([]);
    this.showSuggestions.set(false);
  }

  hideSuggestions(): void {
    setTimeout(() => this.showSuggestions.set(false), 200);
  }

  // ── Map picker ─────────────────────────────────────
  openMapPicker(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.mapPickedAddr.set('');
    this.mapPickedLat.set(null);
    this.mapPickedLon.set(null);
    this.showMapPicker.set(true);
    setTimeout(() => this.initPickerMap(), 60);
  }

  closeMapPicker(): void {
    this.showMapPicker.set(false);
    this.destroyPickerMap();
  }

  confirmMapLocation(): void {
    const addr = this.mapPickedAddr();
    if (!addr) return;
    const short = addr.split(',').slice(0, 4).join(',').trim();
    this.form.controls.location.setValue(short);
    this.closeMapPicker();
  }

  private destroyPickerMap(): void {
    if (this.pickerMap) {
      this.pickerMap.remove();
      this.pickerMap = null;
      this.pickerMarker = null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private initPickerMap(): void {
    if (!this.mapPickerEl?.nativeElement) return;
    import('leaflet').then(L => {
      this.pickerL = L;

      // Center on Lima, or on current location value if it has coords
      this.pickerMap = L.map(this.mapPickerEl!.nativeElement, {
        center: [-12.0464, -77.0428],
        zoom: 13,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(this.pickerMap);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.pickerMap.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        this.mapPickedLat.set(lat);
        this.mapPickedLon.set(lng);
        this.mapPickerLoading.set(true);

        if (this.pickerMarker) {
          this.pickerMarker.setLatLng([lat, lng]);
        } else {
          this.pickerMarker = L.marker([lat, lng]).addTo(this.pickerMap);
        }

        this.addrSvc.reverse(lat, lng).subscribe(addr => {
          this.mapPickedAddr.set(addr);
          this.mapPickerLoading.set(false);
        });
      });
    });
  }

  // ── Submit ─────────────────────────────────────────
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const v = this.form.value;
    const typeMap: Record<string, string> = {
      'Installation': 'INSTALLATION',
      'Maintenance':  'MAINTENANCE',
      'Collection':   'COLLECTION',
    };

    const clientObj = this.clients().find(c => c.id === Number(v.clientId));

    if (this.isEditMode() && this.editId) {
      const payload: UpdateWorkOrderPayload = {
        type:          typeMap[v.type ?? ''] ?? (v.type ?? '').toUpperCase(),
        client:        clientObj?.name ?? '',
        location:      v.location ?? '',
        scheduledDate: v.scheduledDate || undefined,
        scheduledTime: v.scheduledTime || undefined,
        technicianId:  v.technicianId ?? undefined,
        priority:      v.priority ?? 'Standard',
        notes:         v.notes || undefined,
      };
      this.data.updateWorkOrder(this.editId, payload).subscribe({
        next: () => {
          this.activity.log('Work order updated', clientObj?.name);
          this.toast.success('Work order updated successfully');
          this.router.navigate(['/admin/work-orders']);
        },
        error: () => { this.submitting = false; },
      });
    } else {
      const payload: CreateWorkOrderPayload = {
        type:          typeMap[v.type ?? ''] ?? (v.type ?? '').toUpperCase(),
        client:        clientObj?.name ?? '',
        location:      v.location ?? '',
        scheduledDate: v.scheduledDate || undefined,
        scheduledTime: v.scheduledTime || undefined,
        technicianId:  v.technicianId ?? undefined,
        priority:      v.priority ?? 'Standard',
        notes:         v.notes || undefined,
      };
      this.data.createWorkOrder(payload).subscribe({
        next: () => {
          this.activity.log('Work order created', clientObj?.name);
          this.toast.success('Work order created successfully');
          this.router.navigate(['/admin/work-orders']);
        },
        error: () => { this.submitting = false; },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/work-orders']);
  }
}
