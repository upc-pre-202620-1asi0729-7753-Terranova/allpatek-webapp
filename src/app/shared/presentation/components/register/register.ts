import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Logo } from '../logo/logo';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { ProfileStore } from '../../../application/profile.store';
import { SessionStore } from '../../../application/session.store';
import { UserApi } from '../../../infrastructure/user-api';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Registration screen. The chosen role opens that account.
 * The typed fields are not used as credentials.
 */
@Component({
  selector: 'app-register',
  imports: [Logo, TranslatePipe, LanguageSwitcher],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  readonly #router = inject(Router);
  readonly #session = inject(SessionStore);
  readonly #profiles = inject(ProfileStore);
  readonly #users = inject(UserApi);

  protected readonly role = signal<'agricultor' | 'comerciante'>('agricultor');
  protected readonly fullName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly passwordVisible = signal(false);
  protected readonly confirmPasswordVisible = signal(false);

  protected onFullNameInput(event: Event): void {
    this.fullName.set((event.target as HTMLInputElement).value);
  }

  protected onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected onConfirmPasswordInput(event: Event): void {
    this.confirmPassword.set((event.target as HTMLInputElement).value);
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update((visible) => !visible);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const role = this.role();
    this.#users.findByRole(role).subscribe({
      next: (user) => {
        this.#session.enter(
          user?.role ?? role,
          user?.fullName || this.fullName() || role,
          user?.profileId ?? (role === 'comerciante' ? 2 : 1),
        );
        this.#profiles.reload();
        void this.#router.navigate(['/profile']);
      },
      error: () => {
        this.#session.enter(role, this.fullName() || role, role === 'comerciante' ? 2 : 1);
        this.#profiles.reload();
        void this.#router.navigate(['/profile']);
      },
    });
  }

  protected openLogin(): void {
    void this.#router.navigate(['/login']);
  }
}
