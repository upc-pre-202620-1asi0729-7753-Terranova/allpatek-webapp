import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';
import { EvidenceAgreementRef, EvidenceParcelRef } from '../domain/model/evidence-refs';
import { MilestoneEvidence } from '../domain/model/milestone-evidence.entity';
import { EvidenceApi } from '../infrastructure/evidence-api';
import { EvidenceLookupApi } from '../infrastructure/evidence-lookup-api';

/**
 * Milestone evidence for activated contracts.
 * The farmer sends one milestone at a time.
 * The merchant confirms the evidence, then releases that share from the vault.
 */
@Injectable({ providedIn: 'root' })
export class EvidenceStore {
  readonly #evidenceApi = inject(EvidenceApi);
  readonly #lookup = inject(EvidenceLookupApi);
  readonly #evidenceSignal = signal<MilestoneEvidence[]>([]);
  readonly evidence = this.#evidenceSignal.asReadonly();
  readonly #agreementsSignal = signal<EvidenceAgreementRef[]>([]);
  readonly agreements = this.#agreementsSignal.asReadonly();
  readonly #parcelsSignal = signal<EvidenceParcelRef[]>([]);
  readonly parcels = this.#parcelsSignal.asReadonly();

  constructor() {
    this.#evidenceApi
      .getEvidence()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (evidence) => {
          this.#evidenceSignal.update((current) => this.#merge(evidence, current));
        },
        error: () => this.#evidenceSignal.set([]),
      });
    this.#lookup
      .getAgreements()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (items) => this.#agreementsSignal.set(items),
        error: () => this.#agreementsSignal.set([]),
      });
    this.#lookup
      .getParcels()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (items) => this.#parcelsSignal.set(items),
        error: () => this.#parcelsSignal.set([]),
      });
  }

  forParcel(parcelId: string): MilestoneEvidence[] {
    return this.evidence().filter((item) => item.parcelId === parcelId);
  }

  submit(
    parcelId: string,
    milestone: number,
    notes: string,
    fileName: string,
    image: string,
    onDone: (saved: boolean) => void,
  ): void {
    const id = `${parcelId}-${milestone}`;
    const next = new MilestoneEvidence({
      id,
      parcelId,
      milestone,
      status: 'review',
      notes,
      fileName,
      image,
    });
    this.#evidenceApi
      .createEvidence(next)
      .pipe(retry(2))
      .subscribe({
        next: (saved) => {
          this.#remember(saved);
          onDone(true);
        },
        error: () => onDone(false),
      });
  }

  confirm(parcelId: string, milestone: number, onDone: (saved: boolean) => void): void {
    this.#move(parcelId, milestone, 'review', 'verified', onDone);
  }

  release(parcelId: string, milestone: number, onDone: (saved: boolean) => void): void {
    this.#move(parcelId, milestone, 'verified', 'accepted', onDone);
  }

  #move(
    parcelId: string,
    milestone: number,
    from: MilestoneEvidence['status'],
    to: MilestoneEvidence['status'],
    onDone: (saved: boolean) => void,
  ): void {
    const current = this.forParcel(parcelId).find((item) => item.milestone === milestone && item.status === from);
    if (!current) {
      onDone(false);
      return;
    }
    const next = new MilestoneEvidence({ ...current, status: to });
    this.#evidenceApi
      .updateEvidence(next)
      .pipe(retry(2))
      .subscribe({
        next: (saved) => {
          this.#remember(saved);
          onDone(true);
        },
        error: () => onDone(false),
      });
  }

  #remember(saved: MilestoneEvidence): void {
    this.#evidenceSignal.update((items) => [...items.filter((item) => item.id !== saved.id), saved]);
  }

  #merge(incoming: MilestoneEvidence[], current: MilestoneEvidence[]): MilestoneEvidence[] {
    const byId = new Map(incoming.map((item) => [item.id, item]));
    for (const item of current) {
      byId.set(item.id, item);
    }
    return [...byId.values()];
  }
}
