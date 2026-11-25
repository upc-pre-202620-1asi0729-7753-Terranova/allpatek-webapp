import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../domain/model/user-profile.entity';
import { BaseApiEndpoint } from './base-api-endpoint';
import { ProfileAssembler } from './profile-assembler';
import { ProfileResource, ProfilesResponse } from './profiles-response';

export class ProfilesApiEndpoint extends BaseApiEndpoint<
  UserProfile,
  ProfileResource,
  ProfilesResponse,
  ProfileAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderProfilesEndpointPath}`,
      new ProfileAssembler(),
    );
  }

  getMe(): Observable<UserProfile> {
    return this.http.get<ProfileResource>(`${this.endpointUrl}/me`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to fetch current profile')),
    );
  }

  createProfile(profile: UserProfile): Observable<UserProfile> {
    const resource = this.assembler.toResourceFromEntity(profile);
    const body = {
      fullName: resource.fullName,
      phone: resource.phone,
      document: resource.document,
      address: resource.address,
      email: resource.email,
      company: resource.company,
      ruc: resource.ruc,
      activity: resource.activity,
    };
    return this.http.post<ProfileResource>(this.endpointUrl, body).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create profile')),
    );
  }
}
