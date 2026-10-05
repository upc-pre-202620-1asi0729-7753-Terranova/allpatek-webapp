import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { EvidenceAgreementRef, EvidenceParcelRef } from '../domain/model/evidence-refs';

@Injectable({ providedIn: 'root' })
export class EvidenceLookupApi extends BaseApi {
  getAgreements(): Observable<EvidenceAgreementRef[]> {
    return this.#getList(
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderAgreementsEndpointPath}`,
      'agreements',
      (item) => new EvidenceAgreementRef(item as ConstructorParameters<typeof EvidenceAgreementRef>[0]),
    );
  }

  getParcels(): Observable<EvidenceParcelRef[]> {
    return this.#getList(
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderParcelsEndpointPath}`,
      'parcels',
      (item) => new EvidenceParcelRef(item as ConstructorParameters<typeof EvidenceParcelRef>[0]),
    );
  }

  #getList<T>(url: string, key: string, mapItem: (item: Record<string, unknown>) => T): Observable<T[]> {
    return this.http.get<unknown>(url).pipe(
      map((response) => {
        const rows = Array.isArray(response)
          ? response
          : ((response as Record<string, unknown[]>)[key] ?? []);
        return rows.map((item) => mapItem(item as Record<string, unknown>));
      }),
      catchError(() => of([])),
    );
  }
}
