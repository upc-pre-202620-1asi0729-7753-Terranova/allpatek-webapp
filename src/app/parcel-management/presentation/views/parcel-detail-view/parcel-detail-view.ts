import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ParcelStore } from '../../../application/parcel.store';
import { ParcelDetail } from '../../components/parcel-detail/parcel-detail';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-parcel-detail-view',
  imports: [ParcelDetail, RouterLink, TranslatePipe],
  templateUrl: './parcel-detail-view.html',
  styleUrl: './parcel-detail-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParcelDetailView {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #parcels = inject(ParcelStore).parcels;

  readonly #id = toSignal(this.#route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: this.#route.snapshot.paramMap.get('id'),
  });

  protected readonly parcel = computed(
    () => this.#parcels().find((item) => item.id === this.#id()) ?? null,
  );

  protected openContract(): void {
    const id = this.parcel()?.id;
    void this.#router.navigate(['/agreements'], { queryParams: id ? { parcel: id } : {} });
  }
}
