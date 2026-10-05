import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileStore } from '../../../../shared/application/profile.store';
import { AgreementStore } from '../../../application/agreement.store';

/**
 * Farmer inbox. Lists merchants who already signed a request for one of this farmer's parcels.
 */
@Component({
  selector: 'app-contract-list',
  imports: [TranslatePipe],
  templateUrl: './contract-list.html',
  styleUrl: './contract-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractList {
  readonly #router = inject(Router);
  readonly #agreements = inject(AgreementStore);
  readonly #profile = inject(ProfileStore);

  protected readonly requests = computed(() => {
    const ownerId = this.#profile.profile()?.id;
    if (ownerId == null) {
      return [];
    }
    return this.#agreements
      .agreements()
      .filter((agreement) => agreement.merchantSigned)
      .flatMap((agreement) => {
        const parcel = this.#agreements.parcels().find((item) => item.id === agreement.parcelId);
        if (!parcel || parcel.ownerId !== ownerId) {
          return [];
        }
        return [
          {
            agreement,
            parcel,
            merchantName:
              this.#profile.profileById(agreement.merchantProfileId)?.fullName || agreement.merchantName,
          },
        ];
      });
  });

  protected openMerchant(requestId: string): void {
    void this.#router.navigate(['/agreements/merchant'], { queryParams: { request: requestId } });
  }

  protected openRequest(parcelId: string, requestId: string): void {
    void this.#router.navigate(['/agreements'], {
      queryParams: { parcel: parcelId, request: requestId },
    });
  }

  protected initials(name: string): string {
    const parts = name.split(/\s+/).filter(Boolean);
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
}
