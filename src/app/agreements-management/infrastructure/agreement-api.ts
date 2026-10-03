import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Agreement } from '../domain/model/agreement.entity';
import { AgreementsApiEndpoint } from './agreements-api-endpoint';

@Injectable({ providedIn: 'root' })
export class AgreementApi extends BaseApi {
  readonly #agreementsEndpoint = new AgreementsApiEndpoint(this.http);

  getAgreements(): Observable<Agreement[]> {
    return this.#agreementsEndpoint.getAll();
  }

  createAgreement(agreement: Agreement): Observable<Agreement> {
    return this.#agreementsEndpoint.create(agreement);
  }

  updateAgreement(agreement: Agreement): Observable<Agreement> {
    return this.#agreementsEndpoint.update(agreement);
  }
}
