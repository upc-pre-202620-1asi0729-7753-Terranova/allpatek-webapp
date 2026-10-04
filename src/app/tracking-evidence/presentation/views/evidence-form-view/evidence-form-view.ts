import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { EvidenceForm } from '../../components/evidence-form/evidence-form';

@Component({
  selector: 'app-evidence-form-view',
  imports: [EvidenceForm],
  templateUrl: './evidence-form-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/** Opens the upload form for the parcel chosen in the evidence list. */
export class EvidenceFormView {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

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

  protected close(): void {
    void this.#router.navigate(['/evidence']);
  }
}
