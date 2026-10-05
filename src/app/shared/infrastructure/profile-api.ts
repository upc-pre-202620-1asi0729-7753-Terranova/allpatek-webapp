import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserProfile } from '../domain/model/user-profile.entity';
import { BaseApi } from './base-api';
import { ProfilesApiEndpoint } from './profiles-api-endpoint';

@Injectable({ providedIn: 'root' })
export class ProfileApi extends BaseApi {
  readonly #profilesEndpoint = new ProfilesApiEndpoint(this.http);

  getProfiles(): Observable<UserProfile[]> {
    return this.#profilesEndpoint.getAll();
  }

  getProfile(id: number): Observable<UserProfile> {
    return this.#profilesEndpoint.getById(id);
  }

  updateProfile(profile: UserProfile): Observable<UserProfile> {
    return this.#profilesEndpoint.update(profile, profile.id);
  }
}
