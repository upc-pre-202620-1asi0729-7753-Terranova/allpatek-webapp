import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';
import { Agreement } from '../domain/model/agreement.entity';
import { ParcelRef } from '../domain/model/parcel-ref';
import { AgreementApi } from '../infrastructure/agreement-api';
import { ParcelRefApi } from '../infrastructure/parcel-ref-api';

/**
 * Contract signatures stored by the local API.
 * A merchant signature is a request. The farmer signs that request afterwards.
 */
@Injectable({ providedIn: 'root' })
export class AgreementStore {
  readonly #agreementApi = inject(AgreementApi);
  readonly #parcelRefApi = inject(ParcelRefApi);
  readonly #agreementsSignal = signal<Agreement[]>([]);
  readonly agreements = this.#agreementsSignal.asReadonly();
  readonly #parcelsSignal = signal<ParcelRef[]>([]);
  readonly parcels = this.#parcelsSignal.asReadonly();
  readonly #loadedSignal = signal(false);
  readonly loaded = this.#loadedSignal.asReadonly();

  constructor() {
    this.#agreementApi
      .getAgreements()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (agreements) => {
          this.#agreementsSignal.update((current) => this.#merge(agreements, current));
          this.#loadedSignal.set(true);
        },
        error: () => {
          this.#agreementsSignal.set([]);
          this.#loadedSignal.set(true);
        },
      });
    this.#parcelRefApi
      .getParcels()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (parcels) => this.#parcelsSignal.set(parcels),
        error: () => this.#parcelsSignal.set([]),
      });
  }

  find(requestId: string): Agreement | undefined {
    return this.agreements().find((agreement) => agreement.id === requestId);
  }

  signMerchant(
    parcelId: string,
    merchantName: string,
    merchantProfileId: number | null,
    onDone: (saved: boolean) => void,
  ): void {
    const name = merchantName.trim();
    const current = this.agreements().find(
      (agreement) =>
        agreement.parcelId === parcelId &&
        (merchantProfileId != null
          ? agreement.merchantProfileId === merchantProfileId
          : agreement.merchantName.toLowerCase() === name.toLowerCase()),
    );
    this.#save(
      new Agreement({
        id: current?.id ?? `${parcelId}__${slug(name) || Date.now().toString(36)}`,
        parcelId,
        merchantName: name,
        merchantProfileId: merchantProfileId ?? current?.merchantProfileId ?? null,
        merchantSigned: true,
        farmerSigned: current?.farmerSigned ?? false,
        createdAt: current?.createdAt || today(),
      }),
      !!current,
      onDone,
    );
  }

  /** Rewrites the stored merchant name wherever that profile already signed. */
  syncMerchantName(profileId: number, fullName: string): void {
    const name = fullName.trim();
    if (!name) {
      return;
    }
    for (const agreement of this.agreements()) {
      if (agreement.merchantProfileId !== profileId || agreement.merchantName === name) {
        continue;
      }
      this.#save(
        new Agreement({
          id: agreement.id,
          parcelId: agreement.parcelId,
          merchantName: name,
          merchantProfileId: agreement.merchantProfileId,
          merchantSigned: agreement.merchantSigned,
          farmerSigned: agreement.farmerSigned,
          createdAt: agreement.createdAt,
        }),
        true,
        () => undefined,
      );
    }
  }

  signFarmer(requestId: string, onDone: (saved: boolean) => void): void {
    const current = this.find(requestId);
    if (!current?.merchantSigned) {
      onDone(false);
      return;
    }
    this.#save(
      new Agreement({
        id: current.id,
        parcelId: current.parcelId,
        merchantName: current.merchantName,
        merchantProfileId: current.merchantProfileId,
        merchantSigned: true,
        farmerSigned: true,
        createdAt: current.createdAt,
      }),
      true,
      onDone,
    );
  }

  #save(next: Agreement, exists: boolean, onDone: (saved: boolean) => void): void {
    const request = exists ? this.#agreementApi.updateAgreement(next) : this.#agreementApi.createAgreement(next);
    request.pipe(retry(2)).subscribe({
      next: (saved) => {
        this.#agreementsSignal.update((agreements) => [
          ...agreements.filter((agreement) => agreement.id !== saved.id),
          saved,
        ]);
        onDone(true);
      },
      error: () => onDone(false),
    });
  }

  #merge(incoming: Agreement[], current: Agreement[]): Agreement[] {
    const byId = new Map(incoming.map((agreement) => [agreement.id, agreement]));
    for (const agreement of current) {
      if (agreement.merchantSigned || agreement.farmerSigned) {
        byId.set(agreement.id, agreement);
      }
    }
    return [...byId.values()];
  }
}

function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
