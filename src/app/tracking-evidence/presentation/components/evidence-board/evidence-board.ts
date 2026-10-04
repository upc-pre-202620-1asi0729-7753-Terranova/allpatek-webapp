import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EvidenceStore } from '../../../application/evidence.store';
import { ProfileStore } from '../../../../shared/application/profile.store';
import { SessionStore } from '../../../../shared/application/session.store';

export interface EvidenceSelection {
  parcel: string;
  type: string;
}

interface EvidenceRecord extends EvidenceSelection {
  id: string;
  parcelId: string;
  date: string;
  status: 'verified' | 'pending';
}

/**
 * Evidence list. Activated contracts are the rows, and each eye opens
 * the upload or review screen for that parcel.
 */
@Component({
  selector: 'app-evidence-board',
  imports: [TranslatePipe],
  templateUrl: './evidence-board.html',
  styleUrl: './evidence-board.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvidenceBoard {
  readonly #router = inject(Router);
  readonly #session = inject(SessionStore);
  readonly #evidence = inject(EvidenceStore);
  readonly #profile = inject(ProfileStore);

  protected readonly actionPrefix = computed(() =>
    this.#session.role() === 'comerciante' ? 'evidence.reviewOf' : 'evidence.uploadOf',
  );

  protected readonly records = computed<EvidenceRecord[]>(() => {
    const role = this.#session.role();
    const ownerId = this.#profile.profile()?.id;
    const merchantId = this.#session.profileId();
    return this.#evidence
      .agreements()
      .filter((agreement) => agreement.merchantSigned)
      .flatMap((agreement) => {
        const parcel = this.#evidence.parcels().find((item) => item.id === agreement.parcelId);
        if (!parcel) {
          return [];
        }
        if (role === 'agricultor' && parcel.ownerId !== ownerId) {
          return [];
        }
        if (role === 'comerciante' && agreement.merchantProfileId !== merchantId) {
          return [];
        }
        const sent = this.#evidence.forParcel(parcel.id);
        const verified = sent.filter((item) => item.status === 'accepted').length === 4;
        return [
          {
            id: agreement.id,
            parcelId: parcel.id,
            date: formatCreated(agreement.createdAt),
            parcel: parcel.name,
            type: 'evidence.activated',
            status: verified ? ('verified' as const) : ('pending' as const),
          },
        ];
      });
  });

  protected readonly total = computed(() => this.records().length);
  protected readonly pending = computed(() => this.records().filter((item) => item.status === 'pending').length);

  protected openRecord(record: EvidenceRecord): void {
    const review = this.#session.role() === 'comerciante';
    void this.#router.navigate([review ? '/evidence/review' : '/evidence/new'], {
      queryParams: { parcel: record.parcel, parcelId: record.parcelId, type: record.type },
    });
  }
}

function formatCreated(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return '—';
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}
