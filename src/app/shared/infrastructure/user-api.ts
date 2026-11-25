import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountRole } from '../domain/model/account-user.entity';
import { BaseApi } from './base-api';
import { UsersApiEndpoint } from './users-api-endpoint';
import { AuthenticatedUserResource, UserResource } from './users-response';

@Injectable({ providedIn: 'root' })
export class UserApi extends BaseApi {
  readonly #usersEndpoint = new UsersApiEndpoint(this.http);

  signIn(email: string, password: string): Observable<AuthenticatedUserResource> {
    return this.#usersEndpoint.signIn({ username: email.trim(), password });
  }

  signUp(email: string, password: string, role: AccountRole): Observable<UserResource> {
    const iamRole = role === 'comerciante' ? 'ROLE_MERCHANT' : 'ROLE_FARMER';
    return this.#usersEndpoint.signUp({
      username: email.trim(),
      password,
      roles: [iamRole],
    });
  }
}
