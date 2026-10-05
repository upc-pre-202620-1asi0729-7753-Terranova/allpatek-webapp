import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Logo } from '../logo/logo';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { ProfileStore } from '../../../application/profile.store';
import { SessionStore } from '../../../application/session.store';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Role picker. Fields stay visible; submit opens the seeded account for that role.
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
    const profileId = role === 'comerciante' ? 2 : 1;
    const name = this.fullName().trim() || role;
    this.#session.enter(role, name, profileId);
    this.#profiles.reload();
    void this.#router.navigate(['/parcels']);
  }

  protected openLogin(): void {
    void this.#router.navigate(['/login']);
  }
}
