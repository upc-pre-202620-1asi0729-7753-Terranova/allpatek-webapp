import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Logo } from '../logo/logo';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { ProfileStore } from '../../../application/profile.store';
import { roleFromIam, SessionStore } from '../../../application/session.store';
import { UserApi } from '../../../infrastructure/user-api';
import { ProfileApi } from '../../../infrastructure/profile-api';
import { TranslatePipe } from '@ngx-translate/core';
import { switchMap } from 'rxjs';

type LoginError = 'login.required' | 'login.invalid' | 'login.unreachable';

/**
 * Login screen. Credentials go to the local IAM token endpoint.
 */
@Component({
  selector: 'app-login',
  imports: [Logo, TranslatePipe, LanguageSwitcher],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #session = inject(SessionStore);
  readonly #profiles = inject(ProfileStore);
  readonly #users = inject(UserApi);
  readonly #profileApi = inject(ProfileApi);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly passwordVisible = signal(false);
  protected readonly errorKey = signal<LoginError | null>(null);
  protected readonly registered = signal(this.#route.snapshot.queryParamMap.get('registered') === '1');
  protected readonly busy = signal(false);

  protected onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
    this.errorKey.set(null);
  }

  protected onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
    this.errorKey.set(null);
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const email = this.#read(data, 'email').trim() || this.email().trim();
    const password = this.#read(data, 'password') || this.password();
    this.email.set(email);
    this.password.set(password);

    if (!email || !password) {
      this.errorKey.set('login.required');
      return;
    }

    this.busy.set(true);
    this.errorKey.set(null);
    this.#users
      .signIn(email, password)
      .pipe(
        switchMap((auth) => {
          this.#profiles.forget();
          const role = roleFromIam(auth.roles);
          this.#session.enter(role, auth.username ?? '', auth.profileId ?? null, auth.token);
          return this.#profileApi.getMe();
        }),
      )
      .subscribe({
        next: (profile) => {
          this.#profiles.remember(profile);
          this.busy.set(false);
          void this.#router.navigate(['/profile']);
        },
        error: (error: unknown) => {
          this.busy.set(false);
          this.#profiles.forget();
          this.#session.clear();
          const status = (error as { status?: number } | null)?.status;
          this.errorKey.set(status === 0 ? 'login.unreachable' : 'login.invalid');
        },
      });
  }

  protected openRegister(): void {
    void this.#router.navigate(['/register']);
  }

  #read(data: FormData, name: string): string {
    const value = data.get(name);
    return typeof value === 'string' ? value : '';
  }
}
