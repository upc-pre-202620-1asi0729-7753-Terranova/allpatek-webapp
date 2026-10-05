import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { PaymentCard } from '../domain/model/payment-card.entity';
import { WalletAssembler } from './wallet-assembler';
import { WalletResource, WalletsResponse } from './wallets-response';

export class WalletsApiEndpoint extends ErrorHandlingEnabledBaseType {
  readonly #assembler = new WalletAssembler();
  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderWalletsEndpointPath}`;

  constructor(private readonly http: HttpClient) {
    super();
  }

  getAll(): Observable<PaymentCard[]> {
    return this.http.get<WalletsResponse | WalletResource[]>(this.#endpointUrl).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.flatMap((resource) => this.#assembler.toEntityFromResource(resource) ?? []);
        }
        return this.#assembler.toEntitiesFromResponse(response);
      }),
      catchError(this.handleError('Failed to fetch wallets')),
    );
  }

  create(entity: PaymentCard): Observable<PaymentCard> {
    const resource = this.#assembler.toResourceFromEntity(entity);
    return this.http.post<WalletResource>(this.#endpointUrl, resource).pipe(
      map((created) => this.#assembler.toEntityFromResource(created) ?? entity),
      catchError(this.handleError('Failed to create wallet')),
    );
  }

  update(entity: PaymentCard): Observable<PaymentCard> {
    const resource = this.#assembler.toResourceFromEntity(entity);
    return this.http.put<WalletResource>(`${this.#endpointUrl}/${entity.id}`, resource).pipe(
      map((updated) => this.#assembler.toEntityFromResource(updated) ?? entity),
      catchError(this.handleError('Failed to update wallet')),
    );
  }
}
