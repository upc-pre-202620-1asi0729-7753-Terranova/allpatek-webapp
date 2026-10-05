import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { EvidenceReview } from '../../components/evidence-review/evidence-review';

@Component({
  selector: 'app-evidence-review-view',
  imports: [EvidenceReview],
  templateUrl: './evidence-review-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvidenceReviewView {
  readonly #route = inject(ActivatedRoute);

  protected readonly parcel = toSignal(
    this.#route.queryParamMap.pipe(map((params) => params.get('parcel') ?? '')),
    { initialValue: this.#route.snapshot.queryParamMap.get('parcel') ?? '' },
  );

  protected readonly kind = toSignal(
    this.#route.queryParamMap.pipe(map((params) => params.get('type') ?? '')),
    { initialValue: this.#route.snapshot.queryParamMap.get('type') ?? '' },
  );

  protected readonly parcelId = toSignal(
    this.#route.queryParamMap.pipe(map((params) => params.get('parcelId') ?? '')),
    { initialValue: this.#route.snapshot.queryParamMap.get('parcelId') ?? '' },
  );
}
