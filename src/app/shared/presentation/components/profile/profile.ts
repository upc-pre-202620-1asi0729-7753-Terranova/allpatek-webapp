import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileStore } from '../../../application/profile.store';
import { SessionStore } from '../../../application/session.store';
import { UserProfile } from '../../../domain/model/user-profile.entity';

/**
 * Profile screen. Values come from json-server. Edit Information unlocks the
 * fields and Save Changes sends PUT /profiles/:id, as Learning Center does.
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
    fullName: ['', Validators.required],
    phone: [''],
    document: [''],
    address: [''],
    email: ['', [Validators.required, Validators.email]],
    company: [''],
    ruc: [''],
    activity: [''],
  });

  constructor() {
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
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const current = this.#store.profile();
    if (!this.editing() || !current || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (!value.fullName.trim()) {
      this.form.controls.fullName.setErrors({ required: true });
      return;
    }
    this.#store.updateProfile(
      new UserProfile({
        id: current.id,
        fullName: value.fullName,
        phone: value.phone,
        document: value.document,
        address: value.address,
        email: value.email,
        company: value.company,
        ruc: value.ruc,
        activity: value.activity,
      }),
    );
    this.editing.set(false);
  }

  protected closeProfile(): void {
    void this.#router.navigate(['/profile']);
  }
}
