import { AccountUser } from '../domain/model/account-user.entity';
import { UserResource } from './users-response';

export class UserAssembler {
  toEntityFromResource(resource: UserResource): AccountUser {
    return new AccountUser({
      id: Number(resource.id),
      profileId: Number(resource.profileId),
      role: resource.role,
      fullName: resource.fullName,
      email: resource.email,
    });
  }
}
