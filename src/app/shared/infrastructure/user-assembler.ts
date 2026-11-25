import { AccountUser } from '../domain/model/account-user.entity';
import { UserResource } from './users-response';

export class UserAssembler {
  toEntityFromResource(resource: UserResource, profileId: number, fullName: string): AccountUser {
    return new AccountUser({
      id: Number(resource.id),
      profileId,
      role: resource.roles?.includes('ROLE_MERCHANT') ? 'comerciante' : 'agricultor',
      fullName,
      email: resource.username,
    });
  }
}
