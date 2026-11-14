import { Injectable, signal } from '@angular/core';
import { AccountRole } from '../domain/model/account-user.entity';

const MERCHANT_NAME_KEY = 'allpatek.merchantName';
const SESSION_KEY = 'allpatek.session';

type SavedSession = { role: AccountRole; profileId: number };

function readSavedSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { role?: unknown; profileId?: unknown };
    if (parsed.role !== 'agricultor' && parsed.role !== 'comerciante') {
      return null;
    }
    const profileId = Number(parsed.profileId);
    if (!Number.isInteger(profileId) || profileId < 1) {
      return null;
    }
    return { role: parsed.role, profileId };
  } catch {
    return null;
  }
}

/**
 * The person who signed in. The role and profile id come from that user record.
 * They stay in localStorage so a refresh keeps the current workspace URL.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  readonly #saved = readSavedSession();
  readonly #role = signal<AccountRole | null>(this.#saved?.role ?? null);
  readonly role = this.#role.asReadonly();
  readonly #profileId = signal<number | null>(this.#saved?.profileId ?? null);
  readonly profileId = this.#profileId.asReadonly();
  readonly #merchantName = signal(localStorage.getItem(MERCHANT_NAME_KEY) ?? '');
  readonly merchantName = this.#merchantName.asReadonly();

  enter(role: AccountRole, name: string, profileId: number): void {
    const id = Number(profileId);
    this.#role.set(role);
    this.#profileId.set(id);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ role, profileId: id }));
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
    localStorage.removeItem(SESSION_KEY);
  }
}
