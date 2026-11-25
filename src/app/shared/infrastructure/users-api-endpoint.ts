import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from './error-handling-enabled-base-type';
import { AuthenticatedUserResource, SignInResource, SignUpResource, UserResource } from './users-response';

export class UsersApiEndpoint extends ErrorHandlingEnabledBaseType {
  readonly #usersUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderUsersEndpointPath}`;
  readonly #tokensUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderTokensEndpointPath}`;

  constructor(private readonly http: HttpClient) {
    super();
  }

  signUp(resource: SignUpResource): Observable<UserResource> {
    return this.http
      .post<UserResource>(this.#usersUrl, resource)
      .pipe(catchError(this.handleError('Failed to create user')));
  }

  signIn(resource: SignInResource): Observable<AuthenticatedUserResource> {
    return this.http
      .post<AuthenticatedUserResource>(this.#tokensUrl, resource)
      .pipe(catchError(this.handleError('Failed to sign in')));
  }
}
