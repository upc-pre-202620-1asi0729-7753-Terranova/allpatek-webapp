import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileStore } from '../../../../shared/application/profile.store';
import { SessionStore } from '../../../../shared/application/session.store';
import { ParcelStore } from '../../../application/parcel.store';
import { Parcel } from '../../../domain/model/parcel.entity';
import { ParcelCard } from '../parcel-card/parcel-card';

/**
 * Parcel board. A farmer can edit and delete only the parcels they published.
 */
@Component({
  selector: 'app-parcel-board',
  imports: [ParcelCard, TranslatePipe],
  templateUrl: './parcel-board.html',
  styleUrl: './parcel-board.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParcelBoard {
  readonly #router = inject(Router);
  readonly #session = inject(SessionStore);
  readonly #profile = inject(ProfileStore);
  readonly #parcels = inject(ParcelStore);
  protected readonly parcels = this.#parcels.parcels;
  protected readonly loading = this.#parcels.loading;
  protected readonly error = this.#parcels.error;
  protected readonly actionError = this.#parcels.actionError;
  protected readonly ownerId = computed(() => this.#profile.profile()?.id ?? null);
  protected readonly audience = computed(() =>
    this.#session.role() === 'comerciante' ? 'merchant' : 'farmer',
  );

  protected publishParcel(): void {
    void this.#router.navigate(['/parcels/new']);
  }

  protected openParcel(parcel: Parcel): void {
    void this.#router.navigate(['/parcels', parcel.id]);
  }

  protected editParcel(parcel: Parcel): void {
    if (parcel.ownerId !== this.ownerId()) {
      return;
    }
    void this.#router.navigate(['/parcels', parcel.id, 'edit']);
  }

  protected deleteParcel(parcel: Parcel): void {
    if (parcel.ownerId !== this.ownerId()) {
      return;
    }
    this.#parcels.deleteParcel(parcel.id);
  }
}
