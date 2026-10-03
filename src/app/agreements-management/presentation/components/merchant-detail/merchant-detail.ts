import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { ProfileStore } from '../../../../shared/application/profile.store';
import { AgreementStore } from '../../../application/agreement.store';

/**
 * Farmer view of the merchant who asked to lease a parcel.
 * The fields come from that merchant's profile.
 */
@Component({
  selector: 'app-merchant-detail',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './merchant-detail.html',
  styleUrl: './merchant-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MerchantDetail {
  readonly #router = inject(Router);
  readonly #agreements = inject(AgreementStore);
  readonly #profiles = inject(ProfileStore);
  readonly #requestId = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((params) => params.get('request') ?? '')),
    { initialValue: '' },
  );

  protected readonly request = computed(() => this.#agreements.find(this.#requestId()));

  protected readonly parcel = computed(() => {
    const parcelId = this.request()?.parcelId;
    return this.#agreements.parcels().find((item) => item.id === parcelId) ?? null;
  });

  protected readonly merchant = computed(() => {
    const agreement = this.request();
    if (!agreement) {
      return null;
    }
    return (
      this.#profiles.profileById(agreement.merchantProfileId) ??
      this.#profiles.profileByName(agreement.merchantName)
    );
  });

  protected readonly initials = computed(() => {
    const name = this.merchant()?.fullName || this.request()?.merchantName || '';
    const parts = name.split(/\s+/).filter(Boolean);
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  });

  protected shown(value: string | undefined): string {
    return value?.trim() ? value : '';
  }

  protected openContract(): void {
    const agreement = this.request();
    if (!agreement) {
      return;
    }
    void this.#router.navigate(['/agreements'], {
      queryParams: { parcel: agreement.parcelId, request: agreement.id },
    });
  }
}
