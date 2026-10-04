import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, EMPTY, map, switchMap, tap } from 'rxjs';
import { SessionStore } from '../../shared/application/session.store';
import { ParcelRef } from '../domain/model/parcel-ref';
import { WeatherReading } from '../domain/model/weather-reading';
import { ParcelRefApi } from '../infrastructure/parcel-ref-api';
import { WeatherApi, WeatherPlace } from '../infrastructure/weather-api';

/**
 * Weather for every parcel that has latitude and longitude.
 */
@Injectable({ providedIn: 'root' })
export class ClimateStore {
  readonly #session = inject(SessionStore);
  readonly #parcelRefApi = inject(ParcelRefApi);
  readonly #weather = inject(WeatherApi);
  readonly #parcelsSignal = signal<ParcelRef[]>([]);
  readonly #readingsSignal = signal<WeatherReading[]>([]);
  readonly readings = this.#readingsSignal.asReadonly();
  readonly #selectedIdSignal = signal<string | null>(null);
  readonly selectedId = this.#selectedIdSignal.asReadonly();
  readonly #loadingSignal = signal(false);
  readonly loading = this.#loadingSignal.asReadonly();
  readonly #errorSignal = signal(false);
  readonly error = this.#errorSignal.asReadonly();

  constructor() {
    this.#parcelRefApi
      .getParcels()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (parcels) => this.#parcelsSignal.set(parcels),
        error: () => this.#parcelsSignal.set([]),
      });

    toObservable(this.#parcelsSignal)
      .pipe(
        map((parcels) => this.#places(parcels)),
        distinctUntilChanged(
          (left, right) =>
            left.map((place) => `${place.parcelId}:${place.latitude},${place.longitude}`).join('|') ===
            right.map((place) => `${place.parcelId}:${place.latitude},${place.longitude}`).join('|'),
        ),
        tap(() => {
          this.#loadingSignal.set(true);
          this.#errorSignal.set(false);
        }),
        switchMap((places) => {
          if (!places.length) {
            this.#readingsSignal.set([]);
            this.#selectedIdSignal.set(null);
            this.#loadingSignal.set(false);
            return EMPTY;
          }
          return this.#weather.getForecast(places).pipe(
            catchError(() => {
              this.#errorSignal.set(true);
              this.#loadingSignal.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((readings) => {
        this.#readingsSignal.set(readings);
        this.#loadingSignal.set(false);
        if (!readings.some((item) => item.parcelId === this.#selectedIdSignal())) {
          this.#selectedIdSignal.set(readings[0]?.parcelId ?? null);
        }
      });
  }

  select(parcelId: string): void {
    this.#selectedIdSignal.set(parcelId);
  }

  #places(parcels: ParcelRef[]): WeatherPlace[] {
    const ownerId = this.#session.profileId();
    return parcels.flatMap((parcel) => {
      if (ownerId == null || parcel.ownerId !== ownerId) {
        return [];
      }
      const [latitudeText = '', longitudeText = ''] = parcel.location.split(',');
      const latitude = Number(latitudeText.trim());
      const longitude = Number(longitudeText.trim());
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return [];
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return [];
      }
      return [{ parcelId: parcel.id, parcelName: parcel.name, latitude, longitude }];
    });
  }
}
