import { UserProfile } from '../domain/model/user-profile.entity';
import { BaseAssembler } from './base-assembler';
import { ProfileResource, ProfilesResponse } from './profiles-response';

export class ProfileAssembler
  implements BaseAssembler<UserProfile, ProfileResource, ProfilesResponse>
{
  toEntitiesFromResponse(response: ProfilesResponse): UserProfile[] {
    return response.profiles.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: ProfileResource): UserProfile {
    return new UserProfile({
      id: resource.id,
      fullName: resource.fullName,
      phone: resource.phone,
      document: resource.document,
      address: resource.address,
      email: resource.email,
      company: resource.company,
      ruc: resource.ruc,
      activity: resource.activity,
    });
  }

  toResourceFromEntity(entity: UserProfile): ProfileResource {
    return {
      id: entity.id,
      fullName: entity.fullName,
      phone: entity.phone,
      document: entity.document,
      address: entity.address,
      email: entity.email,
      company: entity.company,
      ruc: entity.ruc,
      activity: entity.activity,
    };
  }
}
