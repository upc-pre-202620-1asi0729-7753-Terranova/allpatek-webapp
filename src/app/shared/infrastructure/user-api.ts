import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from './base-api';
import { AccountRole, AccountUser } from '../domain/model/account-user.entity';
import { UsersApiEndpoint } from './users-api-endpoint';

@Injectable({ providedIn: 'root' })
export class UserApi extends BaseApi {
  readonly #usersEndpoint = new UsersApiEndpoint(this.http);

  findByRole(role: AccountRole): Observable<AccountUser | null> {
    return this.#usersEndpoint.findByRole(role);
  }

  syncWithProfile(profileId: number, fullName: string, email: string): Observable<void> {
    return this.#usersEndpoint.syncWithProfile(profileId, fullName, email);
  }
}
