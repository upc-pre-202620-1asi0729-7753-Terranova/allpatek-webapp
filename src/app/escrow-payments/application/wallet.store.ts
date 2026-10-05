import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';
import { SessionStore } from '../../shared/application/session.store';
import { PaymentCard } from '../domain/model/payment-card.entity';
import { WalletApi } from '../infrastructure/wallet-api';

/**
 * The merchant card and its opening balance.
 */
@Injectable({ providedIn: 'root' })
export class WalletStore {
  readonly #walletApi = inject(WalletApi);
  readonly #session = inject(SessionStore);
  readonly #cardsSignal = signal<PaymentCard[]>([]);
  readonly card = computed(
    () => this.#cardsSignal().find((item) => item.profileId === this.#session.profileId()) ?? null,
  );
  readonly #errorSignal = signal(false);
  readonly error = this.#errorSignal.asReadonly();

  constructor() {
    this.#walletApi
      .getWallets()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (cards) => this.#cardsSignal.set(cards),
        error: () => this.#cardsSignal.set([]),
      });
  }

  save(card: PaymentCard, onDone: (saved: boolean) => void): void {
    const exists = this.#cardsSignal().some((item) => item.id === card.id);
    const request = exists ? this.#walletApi.updateWallet(card) : this.#walletApi.createWallet(card);
    this.#errorSignal.set(false);
    request.pipe(retry(2)).subscribe({
      next: (saved) => {
        this.#cardsSignal.update((cards) => [...cards.filter((item) => item.id !== saved.id), saved]);
        onDone(true);
      },
      error: () => {
        this.#errorSignal.set(true);
        onDone(false);
      },
    });
  }
}
