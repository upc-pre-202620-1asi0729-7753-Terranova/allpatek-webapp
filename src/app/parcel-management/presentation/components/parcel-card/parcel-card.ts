import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileStore } from '../../../../shared/application/profile.store';
import { Parcel } from '../../../domain/model/parcel.entity';

/**
 * One parcel card. Edit and delete are offered only when this farmer owns it.
 */
@Component({
  selector: 'app-parcel-card',
  imports: [TranslatePipe],
  templateUrl: './parcel-card.html',
  styleUrl: './parcel-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParcelCard {
  readonly parcel = input.required<Parcel>();
  readonly viewer = input(false);
  readonly owned = input<boolean | null>(false);
  readonly #profiles = inject(ProfileStore);
  protected readonly publisher = computed(
    () => this.#profiles.profileById(this.parcel().ownerId)?.fullName ?? '',
  );
  readonly open = output<void>();
  readonly edit = output<void>();
  readonly remove = output<void>();

  protected openFromCard(): void {
    if (this.viewer()) this.open.emit();
  }

  protected soilKey(value: string): string {
    switch (value) {
      case 'Franco':
        return 'soil.loam';
      case 'Arcilloso':
        return 'soil.clay';
      case 'Arenoso':
        return 'soil.sandy';
      case 'Franco Arenoso':
        return 'soil.sandyLoam';
      case 'Franco Arcilloso':
        return 'soil.clayLoam';
      default:
        return '';
    }
  }
}
