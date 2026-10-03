import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { Agreement } from '../domain/model/agreement.entity';
import { AgreementAssembler } from './agreement-assembler';
import { AgreementResource, AgreementsResponse } from './agreements-response';

export class AgreementsApiEndpoint extends ErrorHandlingEnabledBaseType {
  readonly #assembler = new AgreementAssembler();
  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderAgreementsEndpointPath}`;

  constructor(private readonly http: HttpClient) {
    super();
  }

  getAll(): Observable<Agreement[]> {
    return this.http.get<AgreementsResponse | AgreementResource[]>(this.#endpointUrl).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.map((resource) => this.#assembler.toEntityFromResource(resource));
        }
        return this.#assembler.toEntitiesFromResponse(response);
      }),
      catchError(this.handleError('Failed to fetch agreements')),
    );
  }

  create(entity: Agreement): Observable<Agreement> {
    const resource = this.#assembler.toResourceFromEntity(entity);
    return this.http.post<AgreementResource>(this.#endpointUrl, resource).pipe(
      map((created) => this.#assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create agreement')),
    );
  }

  update(entity: Agreement): Observable<Agreement> {
    const resource = this.#assembler.toResourceFromEntity(entity);
    return this.http.put<AgreementResource>(`${this.#endpointUrl}/${entity.id}`, resource).pipe(
      map((updated) => this.#assembler.toEntityFromResource(updated)),
      catchError(this.handleError('Failed to update agreement')),
    );
  }
}
