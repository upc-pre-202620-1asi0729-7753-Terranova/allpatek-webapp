import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { MilestoneEvidence } from '../domain/model/milestone-evidence.entity';
import { EvidenceAssembler } from './evidence-assembler';
import { EvidenceListResponse, EvidenceResource } from './evidence-response';

export class EvidenceApiEndpoint extends ErrorHandlingEnabledBaseType {
  readonly #assembler = new EvidenceAssembler();
  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderEvidenceEndpointPath}`;

  constructor(private readonly http: HttpClient) {
    super();
  }

  getAll(): Observable<MilestoneEvidence[]> {
    return this.http.get<EvidenceListResponse | EvidenceResource[]>(this.#endpointUrl).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.flatMap((resource) => this.#assembler.toEntityFromResource(resource) ?? []);
        }
        return this.#assembler.toEntitiesFromResponse(response);
      }),
      catchError(this.handleError('Failed to fetch evidence')),
    );
  }

  create(entity: MilestoneEvidence): Observable<MilestoneEvidence> {
    const resource = this.#assembler.toResourceFromEntity(entity);
    return this.http.post<EvidenceResource>(this.#endpointUrl, resource).pipe(
      map((created) => this.#assembler.toEntityFromResource(created) ?? entity),
      catchError(this.handleError('Failed to create evidence')),
    );
  }

  update(entity: MilestoneEvidence): Observable<MilestoneEvidence> {
    const resource = this.#assembler.toResourceFromEntity(entity);
    return this.http.put<EvidenceResource>(`${this.#endpointUrl}/${entity.id}`, resource).pipe(
      map((updated) => this.#assembler.toEntityFromResource(updated) ?? entity),
      catchError(this.handleError('Failed to update evidence')),
    );
  }
}
