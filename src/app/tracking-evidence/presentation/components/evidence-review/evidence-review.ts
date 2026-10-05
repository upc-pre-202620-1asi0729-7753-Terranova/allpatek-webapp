import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileStore } from '../../../../shared/application/profile.store';
import { contractCode } from '../../../../shared/domain/model/contract-code';
import { moneyShares } from '../../../../shared/domain/model/money';
import { EvidenceStore } from '../../../application/evidence.store';
const TITLES = ['escrow.m1', 'escrow.m2', 'escrow.m3', 'escrow.m4'];

/**
 * Merchant review of the farmer's proof.
 * Confirming the evidence does not release the money; that happens in the vault.
 */
@Component({
  selector: 'app-evidence-review',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './evidence-review.html',
  styleUrl: './evidence-review.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvidenceReview {
  readonly parcel = input.required<string>();
  readonly parcelId = input.required<string>();
  readonly kind = input.required<string>();

  readonly #profile = inject(ProfileStore);
  readonly #evidence = inject(EvidenceStore);

  protected readonly farmerName = computed(() => {
    const parcel = this.#evidence.parcels().find((item) => item.id === this.parcelId());
    return this.#profile.profileById(parcel?.ownerId)?.fullName ?? '';
  });
  protected readonly contractId = computed(() => {
    const agreement = this.#evidence
      .agreements()
      .find((item) => item.parcelId === this.parcelId() && item.merchantSigned);
    return agreement ? contractCode(agreement, this.#evidence.agreements()) : '';
  });
  protected readonly items = computed(() => this.#evidence.forParcel(this.parcelId()));
  protected readonly focus = computed(
    () =>
      this.items().find((item) => item.status === 'review') ??
      this.items().find((item) => item.status === 'verified') ??
      null,
  );
  protected readonly shares = computed(() => {
    const parcel = this.#evidence.parcels().find((item) => item.id === this.parcelId());
    return moneyShares(parcel?.campaignCost ?? '');
  });
  protected readonly focusTitle = computed(() => {
    const item = this.focus();
    return item ? TITLES[item.milestone - 1] : '';
  });
  protected readonly focusAmount = computed(() => {
    const item = this.focus();
    return item ? this.shares()[item.milestone - 1] : '';
  });

  protected confirm(): void {
    const current = this.focus();
    if (!current || current.status !== 'review') {
      return;
    }
    this.#evidence.confirm(this.parcelId(), current.milestone, () => undefined);
  }
}
