import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { EscrowAgreementRef, EscrowEvidenceRef, EscrowParcelRef } from '../domain/model/escrow-refs';

@Injectable({ providedIn: 'root' })
export class EscrowLookupApi extends BaseApi {
  getAgreements(): Observable<EscrowAgreementRef[]> {
    return this.#getList(
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderAgreementsEndpointPath}`,
      'agreements',
      (item) => new EscrowAgreementRef(item as ConstructorParameters<typeof EscrowAgreementRef>[0]),
    );
  }

  getParcels(): Observable<EscrowParcelRef[]> {
    return this.#getList(
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderParcelsEndpointPath}`,
      'parcels',
      (item) => new EscrowParcelRef(item as ConstructorParameters<typeof EscrowParcelRef>[0]),
    );
  }

  getEvidence(): Observable<EscrowEvidenceRef[]> {
    return this.#getList(
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderEvidenceEndpointPath}`,
      'evidence',
      (item) => new EscrowEvidenceRef(item as ConstructorParameters<typeof EscrowEvidenceRef>[0]),
    );
  }

  updateEvidence(evidence: EscrowEvidenceRef): Observable<EscrowEvidenceRef> {
    const url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderEvidenceEndpointPath}/${evidence.id}`;
    return this.http.put<EscrowEvidenceRef>(url, evidence).pipe(
      map((saved) => new EscrowEvidenceRef(saved)),
      catchError(() => of(evidence)),
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
