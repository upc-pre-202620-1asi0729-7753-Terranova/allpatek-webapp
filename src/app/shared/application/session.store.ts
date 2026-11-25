import { Injectable, signal } from '@angular/core';
import { AccountRole } from '../domain/model/account-user.entity';

const MERCHANT_NAME_KEY = 'allpatek.merchantName';
const SESSION_KEY = 'allpatek.session';

type SavedSession = { role: AccountRole; profileId: number | null; token: string; fullName: string };

function readSavedSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as {
      role?: unknown;
      profileId?: unknown;
      token?: unknown;
      fullName?: unknown;
    };
    if (parsed.role !== 'agricultor' && parsed.role !== 'comerciante') {
      return null;
    }
    const token = typeof parsed.token === 'string' ? parsed.token : '';
    if (!isUsableAccessToken(token)) {
      return null;
    }
    const profileId = parsed.profileId == null ? null : Number(parsed.profileId);
    if (profileId != null && (!Number.isInteger(profileId) || profileId < 1)) {
      return null;
    }
    const fullName = typeof parsed.fullName === 'string' ? parsed.fullName : '';
    return { role: parsed.role, profileId, token, fullName };
  } catch {
    return null;
  }
}

export function roleFromIam(roles: readonly string[] | null | undefined): AccountRole {
  return roles?.includes('ROLE_MERCHANT') ? 'comerciante' : 'agricultor';
}

export function isUsableAccessToken(token: string | null | undefined): boolean {
  if (!token) {
    return false;
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp !== 'number' || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/**
 * The person who signed in. Role, profile and JWT stay in localStorage across refresh.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  readonly #saved = readSavedSession();
  readonly #role = signal<AccountRole | null>(this.#saved?.role ?? null);
  readonly role = this.#role.asReadonly();
  readonly #profileId = signal<number | null>(this.#saved?.profileId ?? null);
  readonly profileId = this.#profileId.asReadonly();
  readonly #token = signal<string | null>(this.#saved?.token ?? null);
  readonly token = this.#token.asReadonly();
  readonly #fullName = signal(this.#saved?.fullName ?? '');
  readonly fullName = this.#fullName.asReadonly();
  readonly #merchantName = signal(localStorage.getItem(MERCHANT_NAME_KEY) ?? '');
  readonly merchantName = this.#merchantName.asReadonly();

  /** Holds a JWT only so the next HTTP call can create the profile during sign-up. */
  bindToken(token: string): void {
    this.#token.set(token);
  }

  enter(role: AccountRole, name: string, profileId: number | null, token: string): void {
    const id = profileId == null ? null : Number(profileId);
    const fullName = name.trim();
    this.#role.set(role);
    this.#profileId.set(id);
    this.#token.set(token);
    this.#fullName.set(fullName);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ role, profileId: id, token, fullName }));
    this.#rememberMerchant(role, fullName);
  }

  setProfile(profileId: number, name: string): void {
    const role = this.#role();
    const token = this.#token();
    if (!role || !token) {
      return;
    }
    this.enter(role, name, profileId, token);
  }

  /** Keeps the signed-in merchant name aligned with the profile after an edit. */
  rename(name: string): void {
    const fullName = name.trim();
    this.#fullName.set(fullName);
    const role = this.#role();
    const token = this.#token();
    const profileId = this.#profileId();
    if (role && token) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ role, profileId, token, fullName }));
    }
    this.#rememberMerchant(role, fullName);
  }

  #rememberMerchant(role: AccountRole | null, name: string): void {
    const merchantName = name.trim();
    if (role === 'comerciante' && merchantName) {
      this.#merchantName.set(merchantName);
      localStorage.setItem(MERCHANT_NAME_KEY, merchantName);
    }
  }

  signedIn(): boolean {
    return this.#role() != null && isUsableAccessToken(this.#token());
  }

  clear(): void {
    this.#role.set(null);
    this.#profileId.set(null);
    this.#token.set(null);
    this.#fullName.set('');
    this.#merchantName.set('');
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(MERCHANT_NAME_KEY);
  }
}
