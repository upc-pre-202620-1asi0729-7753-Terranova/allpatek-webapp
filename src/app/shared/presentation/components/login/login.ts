import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Logo } from '../logo/logo';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { ProfileStore } from '../../../application/profile.store';
import { SessionStore } from '../../../application/session.store';
import { UserApi } from '../../../infrastructure/user-api';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Login screen. Entering opens the farmer account. The fields are not checked.
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
  readonly #session = inject(SessionStore);
  readonly #profiles = inject(ProfileStore);
  readonly #users = inject(UserApi);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly passwordVisible = signal(false);

  protected onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.#users.findByRole('agricultor').subscribe({
      next: (user) => {
        this.#session.enter(user?.role ?? 'agricultor', user?.fullName || 'agricultor', user?.profileId ?? 1);
        this.#profiles.reload();
        void this.#router.navigate(['/profile']);
      },
      error: () => {
        this.#session.enter('agricultor', 'agricultor', 1);
        this.#profiles.reload();
        void this.#router.navigate(['/profile']);
      },
    });
  }

  protected openRegister(): void {
    void this.#router.navigate(['/register']);
  }
}
