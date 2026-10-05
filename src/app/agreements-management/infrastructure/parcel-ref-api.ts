import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { ParcelRef } from '../domain/model/parcel-ref';

interface ParcelRefResource {
  id: string;
  ownerId?: number;
  name?: string;
  area?: string;
  campaignCost?: string;
  crops?: string[];
}

@Injectable({ providedIn: 'root' })
export class ParcelRefApi extends BaseApi {
  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderParcelsEndpointPath}`;

  getParcels(): Observable<ParcelRef[]> {
    return this.http.get<ParcelRefResource[] | { parcels: ParcelRefResource[] }>(this.#endpointUrl).pipe(
      map((response) => (Array.isArray(response) ? response : response.parcels)),
      map((resources) => resources.map((resource) => new ParcelRef(resource))),
      catchError(() => of([])),
    );
  }
}
