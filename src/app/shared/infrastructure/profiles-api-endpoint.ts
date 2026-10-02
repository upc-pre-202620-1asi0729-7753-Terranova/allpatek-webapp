import { HttpClient } from '@angular/common/http';
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
}
