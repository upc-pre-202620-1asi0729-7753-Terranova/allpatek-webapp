import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Logo } from '../logo/logo';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { ProfileStore } from '../../../application/profile.store';
import { roleFromIam, SessionStore } from '../../../application/session.store';
import { UserApi } from '../../../infrastructure/user-api';
import { ProfileApi } from '../../../infrastructure/profile-api';
import { UserProfile } from '../../../domain/model/user-profile.entity';
import {
  activityError,
  addressError,
  companyError,
  dniError,
  emailError,
  IdentityFieldError,
  personNameError,
  phoneError,
  rucError,
} from '../../../domain/model/identity-fields';
import { TranslatePipe } from '@ngx-translate/core';
import { switchMap } from 'rxjs';

type AccountRole = 'agricultor' | 'comerciante';
type RegisterField =
  | 'fullName'
  | 'phone'
  | 'document'
  | 'address'
  | 'email'
  | 'company'
  | 'ruc'
  | 'activity';

type RegisterError =
  | IdentityFieldError
  | 'register.mismatch'
  | 'register.short'
  | 'register.exists'
  | 'register.unreachable'
  | 'register.failed';

const MIN_PASSWORD = 6;

/**
 * Creates an IAM user and profile, then sends the person to sign in.
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
  readonly #profileApi = inject(ProfileApi);

  protected readonly role = signal<AccountRole>('agricultor');
  protected readonly fullName = signal('');
  protected readonly phone = signal('');
  protected readonly document = signal('');
  protected readonly address = signal('');
  protected readonly email = signal('');
  protected readonly company = signal('');
  protected readonly ruc = signal('');
  protected readonly activity = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly passwordVisible = signal(false);
  protected readonly confirmPasswordVisible = signal(false);
  protected readonly fieldErrors = signal<Partial<Record<RegisterField, IdentityFieldError>>>({});
  protected readonly errorKey = signal<RegisterError | null>(null);
  protected readonly busy = signal(false);
  protected readonly submitted = signal(false);

  protected chooseRole(role: AccountRole): void {
    this.role.set(role);
    this.errorKey.set(null);
    if (this.submitted()) {
      this.fieldErrors.set(this.#collectErrors());
    }
  }

  protected onFullNameInput(event: Event): void {
    this.#setField('fullName', event);
  }

  protected onPhoneInput(event: Event): void {
    this.#setField('phone', event);
  }

  protected onDocumentInput(event: Event): void {
    this.#setField('document', event);
  }

  protected onAddressInput(event: Event): void {
    this.#setField('address', event);
  }

  protected onEmailInput(event: Event): void {
    this.#setField('email', event);
  }

  protected onCompanyInput(event: Event): void {
    this.#setField('company', event);
  }

  protected onRucInput(event: Event): void {
    this.#setField('ruc', event);
  }

  protected onActivityInput(event: Event): void {
    this.#setField('activity', event);
  }

  protected onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
    this.errorKey.set(null);
  }

  protected onConfirmPasswordInput(event: Event): void {
    this.confirmPassword.set((event.target as HTMLInputElement).value);
    this.errorKey.set(null);
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update((visible) => !visible);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const role = this.role();
    const name = (this.#read(data, 'fullName') || this.fullName()).trim();
    const phone = (this.#read(data, 'phone') || this.phone()).trim();
    const identityDocument = (this.#read(data, 'document') || this.document()).trim();
    const address = (this.#read(data, 'address') || this.address()).trim();
    const email = (this.#read(data, 'email') || this.email()).trim();
    const company = (this.#read(data, 'company') || this.company()).trim();
    const ruc = (this.#read(data, 'ruc') || this.ruc()).trim();
    const activity = (this.#read(data, 'activity') || this.activity()).trim();
    const password = this.#read(data, 'password') || this.password();
    const confirm = this.#read(data, 'confirmPassword') || this.confirmPassword();
    this.fullName.set(name);
    this.phone.set(phone);
    this.document.set(identityDocument);
    this.address.set(address);
    this.email.set(email);
    this.company.set(company);
    this.ruc.set(ruc);
    this.activity.set(activity);
    this.password.set(password);
    this.confirmPassword.set(confirm);
    this.submitted.set(true);

    const errors = this.#collectErrors();
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length > 0) {
      this.errorKey.set(null);
      return;
    }
    if (password.length < MIN_PASSWORD) {
      this.errorKey.set('register.short');
      return;
    }
    if (password !== confirm) {
      this.errorKey.set('register.mismatch');
      return;
    }

    this.errorKey.set(null);
    this.busy.set(true);
    this.#users
      .signUp(email, password, role)
      .pipe(
        switchMap(() => this.#users.signIn(email, password)),
        switchMap((auth) => {
          this.#profiles.forget();
          this.#session.enter(roleFromIam(auth.roles), name, auth.profileId ?? null, auth.token);
          return this.#profileApi.createProfile(
            new UserProfile({
              id: 0,
              fullName: name,
              phone,
              document: identityDocument,
              address,
              email,
              company: role === 'comerciante' ? company : '',
              ruc: role === 'comerciante' ? ruc : '',
              activity: role === 'comerciante' ? activity : '',
            }),
          );
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
          this.#session.clear();
          const status = (error as { status?: number } | null)?.status;
          if (status === 0) {
            this.errorKey.set('register.unreachable');
            return;
          }
          if (status === 409) {
            this.errorKey.set('register.exists');
            return;
          }
          this.errorKey.set('register.failed');
        },
      });
  }

  protected openLogin(): void {
    void this.#router.navigate(['/login']);
  }

  #setField(field: RegisterField, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const writers: Record<RegisterField, (next: string) => void> = {
      fullName: (next) => this.fullName.set(next),
      phone: (next) => this.phone.set(next),
      document: (next) => this.document.set(next),
      address: (next) => this.address.set(next),
      email: (next) => this.email.set(next),
      company: (next) => this.company.set(next),
      ruc: (next) => this.ruc.set(next),
      activity: (next) => this.activity.set(next),
    };
    writers[field](value);
    this.errorKey.set(null);
    if (this.submitted()) {
      this.fieldErrors.set(this.#collectErrors());
      return;
    }
    const issue = this.#issueFor(field, value.trim());
    const next = { ...this.fieldErrors() };
    if (issue && value.trim()) {
      next[field] = issue;
    } else {
      delete next[field];
    }
    this.fieldErrors.set(next);
  }

  #issueFor(field: RegisterField, value: string): IdentityFieldError | null {
    if (field === 'fullName') {
      return personNameError(value);
    }
    if (field === 'phone') {
      return phoneError(value);
    }
    if (field === 'document') {
      return dniError(value);
    }
    if (field === 'address') {
      return addressError(value);
    }
    if (field === 'email') {
      return emailError(value);
    }
    if (field === 'company') {
      return companyError(value);
    }
    if (field === 'ruc') {
      return rucError(value);
    }
    return activityError(value);
  }

  #collectErrors(): Partial<Record<RegisterField, IdentityFieldError>> {
    const errors: Partial<Record<RegisterField, IdentityFieldError>> = {};
    const nameIssue = personNameError(this.fullName().trim());
    if (nameIssue) {
      errors.fullName = nameIssue;
    }
    const phoneIssue = phoneError(this.phone().trim());
    if (phoneIssue) {
      errors.phone = phoneIssue;
    }
    const dniIssue = dniError(this.document().trim());
    if (dniIssue) {
      errors.document = dniIssue;
    }
    const addressIssue = addressError(this.address().trim());
    if (addressIssue) {
      errors.address = addressIssue;
    }
    const emailIssue = emailError(this.email().trim());
    if (emailIssue) {
      errors.email = emailIssue;
    }
    if (this.role() === 'comerciante') {
      const companyIssue = companyError(this.company().trim());
      if (companyIssue) {
        errors.company = companyIssue;
      }
      const rucIssue = rucError(this.ruc().trim());
      if (rucIssue) {
        errors.ruc = rucIssue;
      }
      const activityIssue = activityError(this.activity().trim());
      if (activityIssue) {
        errors.activity = activityIssue;
      }
    }
    return errors;
  }

  #read(data: FormData, name: string): string {
    const value = data.get(name);
    return typeof value === 'string' ? value : '';
  }
}
