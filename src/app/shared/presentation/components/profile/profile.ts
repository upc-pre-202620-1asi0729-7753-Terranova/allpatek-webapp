import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileStore } from '../../../application/profile.store';
import { SessionStore } from '../../../application/session.store';
import { UserProfile } from '../../../domain/model/user-profile.entity';
import {
  activityValidators,
  dniValidators,
  personNameValidators,
  phoneValidators,
  rucValidators,
} from '../../../domain/model/identity-fields';

type ProfileField = 'fullName' | 'phone' | 'document' | 'address' | 'email' | 'company' | 'ruc' | 'activity';

/**
 * Profile screen. Edit Information unlocks the fields and Save Changes sends PUT /profiles/:id.
 */
@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  readonly #router = inject(Router);
  readonly #session = inject(SessionStore);
  readonly #store = inject(ProfileStore);
  readonly #formBuilder = inject(FormBuilder);

  protected readonly loading = this.#store.loading;
  protected readonly error = this.#store.error;
  protected readonly saved = this.#store.saved;
  protected readonly editing = signal(false);
  protected readonly roleKey = () =>
    this.#session.role() === 'comerciante' ? 'role.merchant' : 'role.farmer';
  protected readonly merchant = () => this.#session.role() === 'comerciante';

  protected readonly form = this.#formBuilder.nonNullable.group({
    fullName: ['', personNameValidators],
    phone: ['', phoneValidators],
    document: ['', dniValidators],
    address: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    company: [''],
    ruc: [''],
    activity: [''],
  });

  constructor() {
    this.#store.reload();
    effect(() => {
      this.#syncMerchantValidators(this.merchant());
    });
    effect(() => {
      const profile = this.#store.profile();
      if (!profile || this.editing()) {
        return;
      }
      this.form.setValue({
        fullName: profile.fullName,
        phone: profile.phone,
        document: profile.document,
        address: profile.address,
        email: profile.email,
        company: profile.company,
        ruc: profile.ruc,
        activity: profile.activity,
      });
    });
  }

  protected startEditing(): void {
    this.editing.set(true);
    this.form.markAllAsTouched();
  }

  protected markField(field: ProfileField): void {
    this.form.controls[field].markAsDirty();
    this.form.controls[field].markAsTouched();
  }

  protected fieldError(field: ProfileField): string | null {
    const control = this.form.controls[field];
    if (!this.editing() || !control.invalid || (!control.touched && !control.dirty)) {
      return null;
    }
    if (control.hasError('required')) {
      return 'validation.required';
    }
    if (field === 'fullName') {
      return 'validation.name';
    }
    if (field === 'phone') {
      return 'validation.phone';
    }
    if (field === 'document') {
      return 'validation.dni';
    }
    if (field === 'email') {
      return 'validation.email';
    }
    if (field === 'ruc') {
      return 'validation.ruc';
    }
    if (field === 'activity') {
      return 'validation.activity';
    }
    if (field === 'company') {
      return 'validation.company';
    }
    return 'validation.required';
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const current = this.#store.profile();
    if (!this.editing() || !current) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    this.#store.updateProfile(
      new UserProfile({
        id: current.id,
        fullName: value.fullName.trim(),
        phone: value.phone.trim(),
        document: value.document.trim(),
        address: value.address.trim(),
        email: value.email.trim(),
        company: value.company.trim(),
        ruc: value.ruc.trim(),
        activity: value.activity.trim(),
      }),
    );
    this.editing.set(false);
  }

  protected closeProfile(): void {
    void this.#router.navigate(['/profile']);
  }

  #syncMerchantValidators(merchant: boolean): void {
    this.form.controls.company.setValidators(merchant ? Validators.required : []);
    this.form.controls.ruc.setValidators(merchant ? rucValidators : []);
    this.form.controls.activity.setValidators(merchant ? activityValidators : []);
    this.form.controls.company.updateValueAndValidity({ emitEvent: false });
    this.form.controls.ruc.updateValueAndValidity({ emitEvent: false });
    this.form.controls.activity.updateValueAndValidity({ emitEvent: false });
  }
}
