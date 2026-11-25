import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, EMPTY, of, switchMap, tap } from 'rxjs';
import { SessionStore } from '../../shared/application/session.store';
import { WeatherReading } from '../domain/model/weather-reading';
import { AlertsApi } from '../infrastructure/alerts-api';

/**
 * Weather and climate alerts for the signed-in farmer's parcels.
 */
@Injectable({ providedIn: 'root' })
export class ClimateStore {
  readonly #session = inject(SessionStore);
  readonly #alertsApi = inject(AlertsApi);
  readonly #readingsSignal = signal<WeatherReading[]>([]);
  readonly readings = this.#readingsSignal.asReadonly();
  readonly #selectedIdSignal = signal<string | null>(null);
  readonly selectedId = this.#selectedIdSignal.asReadonly();
  readonly #loadingSignal = signal(false);
  readonly loading = this.#loadingSignal.asReadonly();
  readonly #errorSignal = signal(false);
  readonly error = this.#errorSignal.asReadonly();

  constructor() {
    toObservable(this.#session.profileId)
      .pipe(
        distinctUntilChanged(),
        tap(() => {
          this.#loadingSignal.set(true);
          this.#errorSignal.set(false);
        }),
        switchMap(() => {
          if (!this.#session.token()) {
            this.#readingsSignal.set([]);
            this.#selectedIdSignal.set(null);
            this.#loadingSignal.set(false);
            return EMPTY;
          }
          return this.#alertsApi.getReadings().pipe(
            catchError(() => {
              this.#errorSignal.set(true);
              this.#loadingSignal.set(false);
              return of([] as WeatherReading[]);
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
}
