import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { ParcelRef } from '../domain/model/parcel-ref';

@Injectable({ providedIn: 'root' })
export class ParcelRefApi extends BaseApi {
  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderParcelsEndpointPath}`;

  getParcels(): Observable<ParcelRef[]> {
    return this.http.get<unknown>(this.#endpointUrl).pipe(
      map((response) => {
        const rows = Array.isArray(response)
          ? response
          : ((response as { parcels?: unknown[] }).parcels ?? []);
        return rows.map(
          (item) => new ParcelRef(item as ConstructorParameters<typeof ParcelRef>[0]),
        );
      }),
      catchError(() => of([])),
    );
  }
}
