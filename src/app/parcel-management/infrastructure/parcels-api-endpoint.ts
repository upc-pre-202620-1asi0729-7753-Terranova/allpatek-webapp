import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Parcel } from '../domain/model/parcel.entity';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { ParcelAssembler } from './parcel-assembler';
import { ParcelResource, ParcelsResponse } from './parcels-response';

export class ParcelsApiEndpoint extends ErrorHandlingEnabledBaseType {
  readonly #assembler = new ParcelAssembler();
  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderParcelsEndpointPath}`;

  constructor(private readonly http: HttpClient) {
    super();
  }

  getAll(): Observable<Parcel[]> {
    return this.http.get<ParcelsResponse | ParcelResource[]>(this.#endpointUrl).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.map((resource) => this.#assembler.toEntityFromResource(resource));
        }
        return this.#assembler.toEntitiesFromResponse(response);
      }),
      catchError(this.handleError('Failed to fetch parcels')),
    );
  }

  create(entity: Parcel): Observable<Parcel> {
    const resource = this.#assembler.toResourceFromEntity(entity);
    return this.http.post<ParcelResource>(this.#endpointUrl, resource).pipe(
      map((created) => this.#assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create parcel')),
    );
  }

  update(entity: Parcel): Observable<Parcel> {
    const resource = this.#assembler.toResourceFromEntity(entity);
    return this.http.put<ParcelResource>(`${this.#endpointUrl}/${entity.id}`, resource).pipe(
      map((updated) => this.#assembler.toEntityFromResource(updated)),
      catchError(this.handleError('Failed to update parcel')),
    );
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.#endpointUrl}/${id}`)
      .pipe(catchError(this.handleError('Failed to delete parcel')));
  }
}
