import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
import { ProfileStore } from '../../../../shared/application/profile.store';
import { ParcelStore } from '../../../application/parcel.store';
import { formatMoney, parseMoney } from '../../../domain/model/money';
import { Parcel } from '../../../domain/model/parcel.entity';

/** Department capitals. Choosing one only moves the map; it is not stored. */
const DEPARTMENTS: { name: string; latitude: string; longitude: string }[] = [
  { name: 'Amazonas', latitude: '-6.2317', longitude: '-77.8690' },
  { name: 'Áncash', latitude: '-9.5278', longitude: '-77.5278' },
  { name: 'Apurímac', latitude: '-13.6339', longitude: '-72.8814' },
  { name: 'Arequipa', latitude: '-16.4090', longitude: '-71.5375' },
  { name: 'Ayacucho', latitude: '-13.1588', longitude: '-74.2232' },
  { name: 'Cajamarca', latitude: '-7.1617', longitude: '-78.5128' },
  { name: 'Callao', latitude: '-12.0566', longitude: '-77.1181' },
  { name: 'Cusco', latitude: '-13.5319', longitude: '-71.9675' },
  { name: 'Huancavelica', latitude: '-12.7866', longitude: '-74.9764' },
  { name: 'Huánuco', latitude: '-9.9306', longitude: '-76.2422' },
  { name: 'Ica', latitude: '-14.0755', longitude: '-75.7342' },
  { name: 'Junín', latitude: '-12.0651', longitude: '-75.2045' },
  { name: 'La Libertad', latitude: '-8.1116', longitude: '-79.0288' },
  { name: 'Lambayeque', latitude: '-6.7714', longitude: '-79.8409' },
  { name: 'Lima', latitude: '-12.0464', longitude: '-77.0428' },
  { name: 'Loreto', latitude: '-3.7437', longitude: '-73.2516' },
  { name: 'Madre de Dios', latitude: '-12.5933', longitude: '-69.1891' },
  { name: 'Moquegua', latitude: '-17.1931', longitude: '-70.9353' },
  { name: 'Pasco', latitude: '-10.6678', longitude: '-76.2564' },
  { name: 'Piura', latitude: '-5.1945', longitude: '-80.6328' },
  { name: 'Puno', latitude: '-15.8402', longitude: '-70.0219' },
  { name: 'San Martín', latitude: '-6.0342', longitude: '-76.9717' },
  { name: 'Tacna', latitude: '-18.0066', longitude: '-70.2463' },
  { name: 'Tumbes', latitude: '-3.5669', longitude: '-80.4515' },
  { name: 'Ucayali', latitude: '-8.3791', longitude: '-74.5539' },
];

/** The start month and year must fall after the month we are in today. */
function futureStart(control: AbstractControl): ValidationErrors | null {
  const month = Number(control.get('startMonth')?.value);
  const year = Number(control.get('startYear')?.value);
  if (!month || !year) {
    return null;
  }
  const today = new Date();
  const current = today.getFullYear() * 12 + today.getMonth() + 1;
  return year * 12 + month > current ? null : { futureStart: true };
}

/**
 * Publish and edit form. Saving writes the parcel through the local API.
 * Edit is refused when the parcel belongs to another farmer.
 */
@Component({
  selector: 'app-parcel-form',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './parcel-form.html',
  styleUrl: './parcel-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParcelForm {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #store = inject(ParcelStore);
  readonly #profile = inject(ProfileStore);
  readonly #formBuilder = inject(FormBuilder);
  readonly #sanitizer = inject(DomSanitizer);
  readonly #parcelId = this.#route.snapshot.paramMap.get('id');
  #hydrated = false;

  protected readonly departments = DEPARTMENTS;
  protected readonly department = signal('');
  protected readonly locateError = signal(false);
  protected readonly photoError = signal(false);
  protected readonly dragging = signal(false);
  protected readonly months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  protected readonly photos = signal<string[]>([]);
  protected readonly crops = signal<string[]>([]);
  protected readonly cropDraft = signal('');
  protected readonly cropError = signal(false);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  protected readonly editing = signal(this.#parcelId !== null);
  protected readonly actionError = this.#store.actionError;
  protected readonly form = this.#formBuilder.nonNullable.group({
    name: ['', Validators.required],
    area: ['', Validators.required],
    soil: ['', Validators.required],
    cost: ['', Validators.required],
    duration: ['', [Validators.required, Validators.min(7)]],
    startMonth: ['', Validators.required],
    startYear: ['', [Validators.required, Validators.min(2026)]],
    latitude: ['', Validators.required],
    longitude: ['', Validators.required],
  }, { validators: futureStart });

  /** Live preview. The saved parcel keeps only "latitude, longitude". */
  protected readonly mapUrl = toSignal(
    this.form.valueChanges.pipe(
      startWith(this.form.getRawValue()),
      map((value) => this.#mapUrl(String(value.latitude ?? ''), String(value.longitude ?? ''))),
    ),
    { initialValue: this.#mapUrl('', '') },
  );

  constructor() {
    effect(() => {
      if (!this.#parcelId || this.#hydrated) {
        return;
      }
      if (this.#store.loading() || this.#profile.loading()) {
        return;
      }
      const parcel = this.#store.parcels().find((item) => item.id === this.#parcelId);
      const ownerId = this.#profile.profile()?.id;
      if (!parcel || ownerId == null || parcel.ownerId !== ownerId) {
        void this.#router.navigate(['/parcels']);
        return;
      }
      const [latitude = '', longitude = ''] = parcel.location.split(',');
      const [startYear = '', startMonth = ''] = parcel.startMonth.split('-');
      this.form.setValue({
        name: parcel.name,
        area: parcel.area.replace(/\s*ha\s*$/i, ''),
        soil: parcel.soilType,
        cost: parcel.campaignCost.replace(/^S\/\s*/, ''),
        duration: parcel.durationMonths ? String(parcel.durationMonths) : '',
        startMonth: startMonth ? String(Number(startMonth)) : '',
        startYear,
        latitude: latitude.trim(),
        longitude: longitude.trim(),
      });
      this.photos.set([...parcel.images]);
      this.crops.set([...parcel.crops]);
      this.#hydrated = true;
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.form.invalid || !this.crops().length) {
      this.form.markAllAsTouched();
      this.cropError.set(!this.crops().length);
      return;
    }
    const ownerId = this.#profile.profile()?.id;
    if (ownerId == null) {
      return;
    }
    const value = this.form.getRawValue();
    const current = this.#parcelId
      ? this.#store.parcels().find((item) => item.id === this.#parcelId)
      : undefined;
    if (this.editing() && (!current || current.ownerId !== ownerId)) {
      void this.#router.navigate(['/parcels']);
      return;
    }
    const photos = this.photos();
    const parcel = new Parcel({
      id: current?.id ?? this.#parcelIdFrom(value.name),
      ownerId: current?.ownerId ?? ownerId,
      name: value.name,
      status: current?.status ?? 'available',
      area: /ha/i.test(value.area) ? value.area.trim() : `${value.area.trim()} Ha`,
      location: `${value.latitude.trim()}, ${value.longitude.trim()}`,
      soilType: value.soil,
      campaignCost: Number.isFinite(parseMoney(value.cost)) ? formatMoney(parseMoney(value.cost)) : value.cost.trim(),
      durationMonths: Number(value.duration),
      startMonth: `${value.startYear}-${value.startMonth.padStart(2, '0')}`,
      crops: this.crops(),
      imageUrl: photos[0] ?? current?.imageUrl ?? 'assets/workspace/parcel-1.png',
      images: photos.length ? photos : current?.images,
    });
    const done = (saved: boolean) => {
      if (saved) {
        void this.#router.navigate(['/parcels']);
      }
    };
    if (current) {
      this.#store.updateParcel(parcel, done);
    } else {
      this.#store.addParcel(parcel, done);
    }
  }

  protected cancelForm(): void {
    void this.#router.navigate(['/parcels']);
  }

  protected useDepartment(event: Event): void {
    const name = (event.target as HTMLSelectElement).value;
    this.department.set(name);
    const place = DEPARTMENTS.find((item) => item.name === name);
    if (!place) {
      return;
    }
    this.locateError.set(false);
    this.form.patchValue({ latitude: place.latitude, longitude: place.longitude });
  }

  protected locate(): void {
    if (!navigator.geolocation) {
      this.locateError.set(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.department.set('');
        this.locateError.set(false);
        this.form.patchValue({
          latitude: position.coords.latitude.toFixed(4),
          longitude: position.coords.longitude.toFixed(4),
        });
      },
      () => this.locateError.set(true),
    );
  }

  protected addCrop(event: Event): void {
    event.preventDefault();
    const name = this.cropDraft().trim();
    if (!name) {
      return;
    }
    const exists = this.crops().some((crop) => crop.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (!exists) {
      this.crops.update((crops) => [...crops, name]);
    }
    this.cropDraft.set('');
    this.cropError.set(false);
  }

  protected removeCrop(crop: string): void {
    this.crops.update((crops) => crops.filter((item) => item !== crop));
  }

  protected pickPhotos(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected addFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    void this.#addFileList(input.files);
    input.value = '';
  }

  protected onDrag(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(): void {
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    void this.#addFileList(event.dataTransfer?.files ?? null);
  }

  protected removePhoto(index: number): void {
    this.photos.update((photos) => photos.filter((_, item) => item !== index));
  }

  protected makeMain(index: number): void {
    this.photos.update((photos) => {
      const chosen = photos[index];
      if (!chosen || index === 0) {
        return photos;
      }
      return [chosen, ...photos.filter((_, item) => item !== index)];
    });
  }

  async #addFileList(list: FileList | null): Promise<void> {
    if (!list?.length) {
      return;
    }
    const room = 8 - this.photos().length;
    const files = [...list].slice(0, Math.max(room, 0));
    let rejected = list.length > files.length;
    const next: string[] = [];
    for (const file of files) {
      try {
        next.push(await this.#readPhoto(file));
      } catch {
        rejected = true;
      }
    }
    this.photoError.set(rejected);
    if (next.length) {
      this.photos.update((photos) => [...photos, ...next].slice(0, 8));
    }
  }

  #readPhoto(file: File): Promise<string> {
    const allowed = file.type === 'image/png' || file.type === 'image/jpeg';
    if (!allowed || file.size > 10 * 1024 * 1024) {
      return Promise.reject(new Error('invalid photo'));
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read photo'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('decode photo'));
        image.onload = () => {
          const max = 720;
          const scale = Math.min(1, max / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('canvas'));
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  #parcelIdFrom(name: string): string {
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    return `${slug || 'parcela'}-${Date.now().toString(36)}`;
  }

  #mapUrl(latitude: string, longitude: string): SafeResourceUrl {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const valid = Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180;
    const centerLat = valid ? lat : -9.19;
    const centerLng = valid ? lng : -75.0152;
    const span = valid ? 0.012 : 8;
    const bbox = `${centerLng - span},${centerLat - span},${centerLng + span},${centerLat + span}`;
    const marker = valid ? `&marker=${centerLat}%2C${centerLng}` : '';
    return this.#sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`,
    );
  }
}
