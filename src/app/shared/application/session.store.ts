import { Injectable, signal } from '@angular/core';
import { AccountRole } from '../domain/model/account-user.entity';

const MERCHANT_NAME_KEY = 'allpatek.merchantName';

/**
 * The person who signed in. The role and profile id come from that user record.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  readonly #role = signal<AccountRole | null>(null);
  readonly role = this.#role.asReadonly();
  readonly #profileId = signal<number | null>(null);
  readonly profileId = this.#profileId.asReadonly();
  readonly #merchantName = signal(localStorage.getItem(MERCHANT_NAME_KEY) ?? '');
  readonly merchantName = this.#merchantName.asReadonly();

  enter(role: AccountRole, name: string, profileId: number): void {
    this.#role.set(role);
    this.#profileId.set(Number(profileId));
    this.#rememberMerchant(role, name);
  }

  /** Keeps the signed-in merchant name aligned with the profile after an edit. */
  rename(name: string): void {
    this.#rememberMerchant(this.#role(), name);
  }

  #rememberMerchant(role: AccountRole | null, name: string): void {
    const merchantName = name.trim();
    if (role === 'comerciante' && merchantName) {
      this.#merchantName.set(merchantName);
      localStorage.setItem(MERCHANT_NAME_KEY, merchantName);
    }
  }

  clear(): void {
    this.#role.set(null);
    this.#profileId.set(null);
  }
}
