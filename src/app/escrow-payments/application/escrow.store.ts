import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';
import { EscrowAgreementRef, EscrowEvidenceRef, EscrowParcelRef } from '../domain/model/escrow-refs';
import { EscrowLookupApi } from '../infrastructure/escrow-lookup-api';

/**
 * Vault data assembled from agreements, parcels and evidence ids.
 */
@Injectable({ providedIn: 'root' })
export class EscrowStore {
  readonly #lookup = inject(EscrowLookupApi);
  readonly #agreementsSignal = signal<EscrowAgreementRef[]>([]);
  readonly agreements = this.#agreementsSignal.asReadonly();
  readonly #parcelsSignal = signal<EscrowParcelRef[]>([]);
  readonly parcels = this.#parcelsSignal.asReadonly();
  readonly #evidenceSignal = signal<EscrowEvidenceRef[]>([]);
  readonly evidence = this.#evidenceSignal.asReadonly();

  constructor() {
    this.#lookup
      .getAgreements()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: (items) => this.#agreementsSignal.set(items), error: () => this.#agreementsSignal.set([]) });
    this.#lookup
      .getParcels()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: (items) => this.#parcelsSignal.set(items), error: () => this.#parcelsSignal.set([]) });
    this.#lookup
      .getEvidence()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: (items) => this.#evidenceSignal.set(items), error: () => this.#evidenceSignal.set([]) });
  }

  forParcel(parcelId: string): EscrowEvidenceRef[] {
    return this.evidence().filter((item) => item.parcelId === parcelId);
  }

  release(parcelId: string, milestone: number, onDone: (saved: boolean) => void): void {
    const current = this.forParcel(parcelId).find((item) => item.milestone === milestone && item.status === 'verified');
    if (!current) {
      onDone(false);
      return;
    }
    const next = new EscrowEvidenceRef({ ...current, status: 'accepted' });
    this.#lookup
      .updateEvidence(next)
      .pipe(retry(2))
      .subscribe({
        next: (saved) => {
          this.#evidenceSignal.update((items) => [...items.filter((item) => item.id !== saved.id), saved]);
          onDone(true);
        },
        error: () => onDone(false),
      });
  }
}
