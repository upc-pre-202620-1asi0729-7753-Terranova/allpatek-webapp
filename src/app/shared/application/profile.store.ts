import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';
import { SessionStore } from './session.store';
import { UserProfile } from '../domain/model/user-profile.entity';
import { ProfileApi } from '../infrastructure/profile-api';

/**
 * Profiles of the people who can sign in.
 * The active profile is always the one returned by GET /profiles/me.
 */
@Injectable({ providedIn: 'root' })
export class ProfileStore {
  readonly #destroyRef = inject(DestroyRef);
  readonly #profileApi = inject(ProfileApi);
  readonly #session = inject(SessionStore);
  readonly #me = signal<UserProfile | null>(null);
  readonly #profilesSignal = signal<UserProfile[]>([]);
  readonly profile = computed(() => {
    if (!this.#session.token()) {
      return null;
    }
    const mine = this.#me();
    if (mine) {
      return mine;
    }
    const sessionId = this.#session.profileId();
    return this.#profilesSignal().find((item) => item.id === sessionId) ?? null;
  });
  readonly #loadingSignal = signal(false);
  readonly loading = this.#loadingSignal.asReadonly();
  readonly #errorSignal = signal<'load' | 'save' | null>(null);
  readonly error = this.#errorSignal.asReadonly();
  readonly #savedSignal = signal(false);
  readonly saved = this.#savedSignal.asReadonly();

  constructor() {
    if (this.#session.token()) {
      this.reload();
    }
  }

  /** Reads the signed-in profile and the directory used by other screens. */
  reload(): void {
    this.#loadMine();
    this.#loadDirectory();
  }

  remember(profile: UserProfile): void {
    this.#me.set(profile);
    this.#profilesSignal.update((items) => [...items.filter((item) => item.id !== profile.id), profile]);
    this.#session.setProfile(profile.id, profile.fullName);
  }

  /** Drops cached identity so the next sign-in cannot show someone else's name. */
  forget(): void {
    this.#me.set(null);
    this.#profilesSignal.set([]);
    this.#errorSignal.set(null);
    this.#savedSignal.set(false);
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
    if (this.#me()?.id === id) {
      return this.#me();
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
          this.remember(profile);
          this.#loadingSignal.set(false);
          this.#savedSignal.set(true);
        },
        error: () => {
          this.#errorSignal.set('save');
          this.#loadingSignal.set(false);
        },
      });
  }

  #loadMine(): void {
    if (!this.#session.token()) {
      this.#me.set(null);
      return;
    }
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);
    this.#profileApi.getMe().subscribe({
      next: (profile) => {
        this.remember(profile);
        this.#loadingSignal.set(false);
      },
      error: () => {
        this.#errorSignal.set('load');
        this.#loadingSignal.set(false);
      },
    });
  }

  #loadDirectory(): void {
    if (!this.#session.token()) {
      this.#profilesSignal.set([]);
      return;
    }
    this.#profileApi
      .getProfiles()
      .pipe(retry(2), takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (profiles) => this.#profilesSignal.set(profiles),
        error: () => this.#profilesSignal.set([]),
      });
  }
}
