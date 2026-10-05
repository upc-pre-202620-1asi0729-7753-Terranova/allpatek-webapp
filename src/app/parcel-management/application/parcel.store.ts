import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';
import { Parcel } from '../domain/model/parcel.entity';
import { ParcelApi } from '../infrastructure/parcel-api';

/**
 * Parcel list from the local API. Create, update and delete follow the same
 * store path Learning Center uses for a course.
 */
@Injectable({ providedIn: 'root' })
export class ParcelStore {
  readonly #parcelApi = inject(ParcelApi);
  readonly #parcelsSignal = signal<Parcel[]>([]);
  readonly parcels = this.#parcelsSignal.asReadonly();
  readonly parcelCount = computed(() => this.parcels().length);
  readonly #loadingSignal = signal(false);
  readonly loading = this.#loadingSignal.asReadonly();
  readonly #errorSignal = signal<string | null>(null);
  readonly error = this.#errorSignal.asReadonly();
  readonly #actionErrorSignal = signal<'save' | 'delete' | null>(null);
  readonly actionError = this.#actionErrorSignal.asReadonly();

  constructor() {
    this.#loadParcels();
  }

  addParcel(parcel: Parcel, onDone: (saved: boolean) => void): void {
    this.#actionErrorSignal.set(null);
    this.#parcelApi
      .createParcel(parcel)
      .pipe(retry(2))
      .subscribe({
        next: (created) => {
          this.#parcelsSignal.update((parcels) => [...parcels, created]);
          onDone(true);
        },
        error: () => {
          this.#actionErrorSignal.set('save');
          onDone(false);
        },
      });
  }

  updateParcel(updated: Parcel, onDone: (saved: boolean) => void): void {
    this.#actionErrorSignal.set(null);
    this.#parcelApi
      .updateParcel(updated)
      .pipe(retry(2))
      .subscribe({
        next: (parcel) => {
          this.#parcelsSignal.update((parcels) =>
            parcels.map((item) => (item.id === parcel.id ? parcel : item)),
          );
          onDone(true);
        },
        error: () => {
          this.#actionErrorSignal.set('save');
          onDone(false);
        },
      });
  }

  deleteParcel(id: string): void {
    this.#actionErrorSignal.set(null);
    this.#parcelApi
      .deleteParcel(id)
      .pipe(retry(2))
      .subscribe({
        next: () => {
          this.#parcelsSignal.update((parcels) => parcels.filter((item) => item.id !== id));
        },
        error: () => {
          this.#actionErrorSignal.set('delete');
        },
      });
  }

  #loadParcels(): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);
    this.#parcelApi
      .getParcels()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (parcels) => {
          this.#parcelsSignal.set(parcels);
          this.#loadingSignal.set(false);
          this.#errorSignal.set(null);
        },
        error: () => {
          this.#errorSignal.set('load');
          this.#loadingSignal.set(false);
        },
      });
  }
}
