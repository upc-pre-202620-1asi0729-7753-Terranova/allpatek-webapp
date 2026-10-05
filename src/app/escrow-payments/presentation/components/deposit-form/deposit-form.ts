import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { formatMoney, parseMoney } from '../../../../shared/domain/model/money';
import { SessionStore } from '../../../../shared/application/session.store';
import { WalletStore } from '../../../application/wallet.store';
import { PaymentCard } from '../../../domain/model/payment-card.entity';

/**
 * Merchant card. The balance is the amount they type.
 * Disbursements deduct from it. The full number and the CVV are checked and then discarded.
 */
@Component({
  selector: 'app-deposit-form',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './deposit-form.html',
  styleUrl: './deposit-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositForm {
  readonly #router = inject(Router);
  readonly #session = inject(SessionStore);
  readonly #wallet = inject(WalletStore);
  readonly #formBuilder = inject(FormBuilder);

  protected readonly invalid = signal(false);
  protected readonly failed = signal(false);
  protected readonly form = this.#formBuilder.nonNullable.group({
    amount: ['', Validators.required],
    number: ['', Validators.required],
    holder: ['', Validators.required],
    expiry: ['', Validators.required],
    cvv: ['', Validators.required],
  });
  readonly #draft = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly preview = computed(() => {
    const draft = this.#draft();
    const digits = (draft.number ?? '').replace(/\D/g, '').slice(0, 16);
    const amount = parseMoney(draft.amount ?? '');
    return {
      brand: digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : 'Tarjeta',
      number: this.#masked(digits),
      holder: (draft.holder ?? '').trim() || '—',
      expiry: (draft.expiry ?? '').trim() || 'MM/AA',
      amount: Number.isFinite(amount) && amount > 0 ? formatMoney(amount) : 'S/ 0.00',
    };
  });

  protected confirm(event: Event): void {
    event.preventDefault();
    const profileId = this.#session.profileId();
    const value = this.form.getRawValue();
    const digits = value.number.replace(/\D/g, '');
    const expiry = value.expiry.trim();
    const holder = value.holder.trim();
    const cvv = value.cvv.trim();
    const amount = parseMoney(value.amount);
    const openingCents = Math.round(amount * 100);
    if (
      !profileId ||
      !Number.isFinite(amount) ||
      openingCents < 1 ||
      digits.length !== 16 ||
      !/^\d{2}\/\d{2}$/.test(expiry) ||
      !/^\d{3,4}$/.test(cvv) ||
      !holder
    ) {
      this.invalid.set(true);
      this.form.markAllAsTouched();
      return;
    }
    this.invalid.set(false);
    this.failed.set(false);
    const brand = digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : 'Tarjeta';
    this.#wallet.save(
      new PaymentCard({
        id: String(profileId),
        profileId,
        holder,
        last4: digits.slice(-4),
        expiry,
        brand,
        openingCents,
      }),
      (saved) => {
        if (saved) {
          void this.#router.navigate(['/escrow']);
          return;
        }
        this.failed.set(true);
      },
    );
  }

  protected backToVault(): void {
    void this.#router.navigate(['/escrow']);
  }

  #masked(digits: string): string {
    const visible = digits.padEnd(16, '•');
    return visible.replace(/(.{4})/g, '$1 ').trim();
  }
}
