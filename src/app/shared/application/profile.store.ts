import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';
import { SessionStore } from './session.store';
import { UserProfile } from '../domain/model/user-profile.entity';
import { ProfileApi } from '../infrastructure/profile-api';
import { UserApi } from '../infrastructure/user-api';

/**
 * Profiles of the people who can sign in.
 * The active profile is the one that belongs to the current session.
 */
@Injectable({ providedIn: 'root' })
export class ProfileStore {
  readonly #destroyRef = inject(DestroyRef);
  readonly #profileApi = inject(ProfileApi);
  readonly #session = inject(SessionStore);
  readonly #users = inject(UserApi);
  readonly #profilesSignal = signal<UserProfile[]>([]);
  readonly profile = computed(
    () => this.#profilesSignal().find((item) => item.id === this.#session.profileId()) ?? null,
  );
  readonly #loadingSignal = signal(false);
  readonly loading = this.#loadingSignal.asReadonly();
  readonly #errorSignal = signal<'load' | 'save' | null>(null);
  readonly error = this.#errorSignal.asReadonly();
  readonly #savedSignal = signal(false);
  readonly saved = this.#savedSignal.asReadonly();

  constructor() {
    this.reload();
  }

  /** Reads the profiles again from the platform API (Azure or local). */
  reload(): void {
    this.#loadProfile();
  }

  profileByName(name: string): UserProfile | null {
    const key = name.trim().toLowerCase();
    if (!key) {
      return null;
    }
    return this.#profilesSignal().find((item) => item.fullName.toLowerCase() === key) ?? null;
  }

  profileById(id: number | null | undefined): UserProfile | null {
    if (id == null) {
      return null;
    }
    return this.#profilesSignal().find((item) => item.id === id) ?? null;
  }

  updateProfile(updated: UserProfile): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);
    this.#savedSignal.set(false);
    this.#profileApi
      .updateProfile(updated)
      .pipe(retry(2))
      .subscribe({
        next: (profile) => {
          this.#profilesSignal.update((items) => items.map((item) => (item.id === profile.id ? profile : item)));
          if (profile.id === this.#session.profileId()) {
            this.#session.rename(profile.fullName);
          }
          this.#users.syncWithProfile(profile.id, profile.fullName, profile.email).subscribe({ error: () => undefined });
          this.#loadingSignal.set(false);
          this.#savedSignal.set(true);
        },
        error: () => {
          this.#errorSignal.set('save');
          this.#loadingSignal.set(false);
        },
      });
  }

  #loadProfile(): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);
    this.#profileApi
      .getProfiles()
      .pipe(retry(2), takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (profiles) => {
          this.#profilesSignal.set(profiles);
          this.#loadingSignal.set(false);
        },
        error: () => {
          this.#errorSignal.set('load');
          this.#loadingSignal.set(false);
        },
      });
  }
}
