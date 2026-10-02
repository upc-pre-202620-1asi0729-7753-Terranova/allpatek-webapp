import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AccountRole, AccountUser } from '../domain/model/account-user.entity';
import { ErrorHandlingEnabledBaseType } from './error-handling-enabled-base-type';
import { UserAssembler } from './user-assembler';
import { UserResource } from './users-response';

export class UsersApiEndpoint extends ErrorHandlingEnabledBaseType {
  readonly #assembler = new UserAssembler();
  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderUsersEndpointPath}`;

  constructor(private readonly http: HttpClient) {
    super();
  }

  findByRole(role: AccountRole): Observable<AccountUser | null> {
    return this.http.get<UserResource[]>(this.#endpointUrl, { params: { role } }).pipe(
      map((users) => {
        const match = users.find((user) => user.role === role);
        return match ? this.#assembler.toEntityFromResource(match) : null;
      }),
      catchError(this.handleError('Failed to find user')),
    );
  }

  /** Copies the profile name and email onto the account that points at that profile. */
  syncWithProfile(profileId: number, fullName: string, email: string): Observable<void> {
    const name = fullName.trim();
    const mail = email.trim();
    return this.http.get<Array<UserResource & { password?: string }>>(this.#endpointUrl).pipe(
      switchMap((users) => {
        const match = users.find((user) => user.profileId === profileId);
        if (!match || !name || !mail) {
          return of(undefined);
        }
        return this.http
          .put(`${this.#endpointUrl}/${match.id}`, { ...match, fullName: name, email: mail })
          .pipe(map(() => undefined));
      }),
      catchError(this.handleError('Failed to sync user')),
    );
  }
}
