import {
  Component, inject, signal, OnInit, OnDestroy,
  PLATFORM_ID, ViewChild, ElementRef
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, UntypedFormGroup } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DataService } from '../../../../core/services/data.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AddressLookupService, AddressSuggestion } from '../../../../core/services/address-lookup.service';

type ClientType = 'company' | 'individual';

@Component({
  selector: 'app-edit-client',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink],
  templateUrl: './edit-client.html',
  styleUrl: './edit-client.scss',
})
export class EditClient implements OnInit, OnDestroy {
  private fb      = inject(FormBuilder);
  private router  = inject(Router);
  private route   = inject(ActivatedRoute);
  private data    = inject(DataService);
  private toast   = inject(ToastService);
  private addrSvc = inject(AddressLookupService);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('mapPickerEl') mapPickerEl?: ElementRef<HTMLDivElement>;

  clientType  = signal<ClientType>('company');
  submitted   = false;
  saving      = signal(false);
  private userId: string | null = null;
  isNewClient = signal(false);

  // Address autocomplete
  addressSuggestions = signal<AddressSuggestion[]>([]);
  showSuggestions    = signal(false);
  private addrInput$ = new Subject<{ query: string; form: ClientType }>();
  private activeAddrForm: ClientType = 'company';

  // Map picker
  showMapPicker    = signal(false);
  mapPickedAddr    = signal('');
  mapPickedLat     = signal<number | null>(null);
  mapPickedLon     = signal<number | null>(null);
  mapPickerLoading = signal(false);
  private pickerFormTarget: ClientType = 'company';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pickerMap: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pickerMarker: any = null;

  companyForm = this.fb.group({
    companyName:  ['', Validators.required],
    taxId:        [''],
    industry:     [''],
    address:      ['', Validators.required],
    country:      ['Perú'],
    contactName:  ['', Validators.required],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: [''],
    statusActive: [true],
    notes:        [''],
  });

  individualForm = this.fb.group({
    fullName:     ['', Validators.required],
    docId:        [''],
    address:      ['', Validators.required],
    country:      ['Perú'],
    contactName:  ['', Validators.required],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: [''],
    statusActive: [true],
    notes:        [''],
  });

  get activeForm(): UntypedFormGroup {
    return (this.clientType() === 'company' ? this.companyForm : this.individualForm) as UntypedFormGroup;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'new') {
      this.isNewClient.set(true);
    }
    if (id && id !== 'new') {
      this.userId = id;
      this.data.getUserById(id).subscribe(user => {
        if (!user) return;
        const addr = user.address ?? user.location ?? '';
        const active = user.status === 'active';
        // Open the form matching how the client was registered.
        this.clientType.set(user.clientType === 'individual' ? 'individual' : 'company');

        this.companyForm.patchValue({
          companyName:  user.name,
          taxId:        user.taxId ?? '',
          industry:     user.industry ?? '',
          address:      addr,
          country:      user.country ?? 'Perú',
          contactName:  user.contactName ?? '',
          contactEmail: user.contactEmail ?? user.email,
          contactPhone: user.contactPhone ?? user.phone ?? '',
          statusActive: active,
          notes:        user.notes ?? '',
        });
        this.individualForm.patchValue({
          fullName:     user.name,
          docId:        user.taxId ?? '',
          address:      addr,
          country:      user.country ?? 'Perú',
          contactName:  user.contactName ?? '',
          contactEmail: user.contactEmail ?? user.email,
          contactPhone: user.contactPhone ?? user.phone ?? '',
          statusActive: active,
          notes:        user.notes ?? '',
        });
      });
    }

    if (isPlatformBrowser(this.platformId)) {
      this.addrInput$.pipe(
        debounceTime(400),
        distinctUntilChanged((a, b) => a.query === b.query),
        switchMap(({ query }) => this.addrSvc.search(query))
      ).subscribe(results => {
        this.addressSuggestions.set(results);
        this.showSuggestions.set(results.length > 0);
      });
    }
  }

  ngOnDestroy(): void {
    this.destroyPickerMap();
  }

  setType(type: ClientType): void {
    this.clientType.set(type);
    this.showSuggestions.set(false);
  }

  // ── Address autocomplete ───────────────────────────
  onAddressInput(value: string, form: ClientType): void {
    this.activeAddrForm = form;
    this.activeForm.patchValue({ address: value });
    this.addrInput$.next({ query: value, form });
  }

  selectAddress(suggestion: AddressSuggestion, form: ClientType): void {
    const short = suggestion.display_name.split(',').slice(0, 3).join(',').trim();
    (form === 'company' ? this.companyForm : this.individualForm).patchValue({ address: short });
    this.showSuggestions.set(false);
    this.addressSuggestions.set([]);
  }

  hideSuggestions(): void {
    setTimeout(() => this.showSuggestions.set(false), 200);
  }

  // ── Map picker ─────────────────────────────────────
  openMapPicker(form: ClientType): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.pickerFormTarget = form;
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
    (this.pickerFormTarget === 'company' ? this.companyForm : this.individualForm)
      .patchValue({ address: short });
    this.closeMapPicker();
  }

  private destroyPickerMap(): void {
    if (this.pickerMap) {
      this.pickerMap.remove();
      this.pickerMap = null;
      this.pickerMarker = null;
    }
  }

  private initPickerMap(): void {
    if (!this.mapPickerEl?.nativeElement) return;
    import('leaflet').then(L => {
      this.pickerMap = L.map(this.mapPickerEl!.nativeElement, {
        center: [-12.0464, -77.0428],
        zoom: 13,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(this.pickerMap);

      // In production CSS loads asynchronously; the container may have size 0 at
      // init → blank tiles. Recompute size once layout/CSS settles.
      [0, 200, 500].forEach(d => setTimeout(() => { if (this.pickerMap) this.pickerMap.invalidateSize(); }, d));

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

  isInvalid(field: string): boolean {
    const c = this.activeForm.get(field);
    return !!(this.submitted && c && c.invalid);
  }

  submit(): void {
    this.submitted = true;
    if (this.activeForm.invalid) return;
    const v = this.activeForm.value as Record<string, string | boolean | null>;
    this.saving.set(true);
    const status = v['statusActive'] ? 'active' : 'inactive';
    const type   = this.clientType();
    // Entity name = company name OR full name; tax id = RUC (company) OR doc id (individual).
    const name   = (type === 'company' ? (v['companyName'] as string) : (v['fullName'] as string)) ?? '';
    const taxId  = (type === 'company' ? (v['taxId'] as string) : (v['docId'] as string)) ?? '';

    if (this.userId) {
      this.data.updateUser(this.userId, {
        name,
        phone:        (v['contactPhone'] as string) ?? '',
        status,
        notes:        (v['notes'] as string) ?? '',
        address:      (v['address'] as string) ?? '',
        location:     (v['address'] as string) ?? '',
        country:      (v['country'] as string) ?? '',
        clientType:   type,
        taxId,
        industry:     (v['industry'] as string) ?? '',
        contactName:  (v['contactName'] as string) ?? '',
        contactEmail: (v['contactEmail'] as string) ?? '',
        contactPhone: (v['contactPhone'] as string) ?? '',
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
      // Client creation is disabled from the web — clients are edited only.
      this.saving.set(false);
      this.toast.error('Clients cannot be created from the web.');
      this.router.navigate(['/admin/users']);
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }
}
