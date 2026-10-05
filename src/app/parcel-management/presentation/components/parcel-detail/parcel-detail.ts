import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileStore } from '../../../../shared/application/profile.store';
import { moneyShares } from '../../../../shared/domain/model/money';
import { Parcel } from '../../../domain/model/parcel.entity';

/**
 * Contracting detail for one parcel. Requesting a contract does not create one.
 */
@Component({
  selector: 'app-parcel-detail',
  imports: [TranslatePipe],
  templateUrl: './parcel-detail.html',
  styleUrl: './parcel-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParcelDetail {
  readonly parcel = input.required<Parcel>();
  readonly request = output<void>();

  readonly #profiles = inject(ProfileStore);
  readonly #chosen = signal('');

  protected readonly photos = computed(() => this.parcel().images.filter((photo) => photo.trim()));
  protected readonly hero = computed(() => this.#chosen() || this.parcel().imageUrl);
  protected readonly publisher = computed(
    () => this.#profiles.profileById(this.parcel().ownerId)?.fullName ?? '',
  );

  protected choose(photo: string): void {
    this.#chosen.set(photo);
  }

  protected readonly milestones = ['detail.m1', 'detail.m2', 'detail.m3', 'detail.m4'];
  protected readonly shares = computed(() => moneyShares(this.parcel().campaignCost));

  protected startMonthKey(): string {
    const month = Number(this.parcel().startMonth.split('-')[1]);
    return month >= 1 && month <= 12 ? `form.month.${month}` : '';
  }

  protected startYear(): string {
    return this.parcel().startMonth.split('-')[0] ?? '';
  }

  protected soilKey(): string {
    if (this.parcel().id === 'el-vergel') {
      return 'soil.clayLoam';
    }
    switch (this.parcel().soilType) {
      case 'Franco':
        return 'soil.loam';
      case 'Arcilloso':
        return 'soil.clay';
      case 'Arenoso':
        return 'soil.sandy';
      case 'Franco Arenoso':
        return 'soil.sandyLoam';
      default:
        return '';
    }
  }
}
