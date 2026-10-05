import { BaseEntity } from './base-entity';

export type AccountRole = 'agricultor' | 'comerciante';

/** A person who can sign in as a farmer or a merchant. */
export class AccountUser implements BaseEntity {
  readonly id: number;
  readonly profileId: number;
  readonly role: AccountRole;
  readonly fullName: string;
  readonly email: string;

  constructor(user: {
    id: number;
    profileId: number;
    role: string;
    fullName: string;
    email: string;
  }) {
    if (!Number.isInteger(user.id) || user.id < 1 || !Number.isInteger(user.profileId) || user.profileId < 1) {
      throw new Error('User must point at a profile.');
    }
    if (user.role !== 'agricultor' && user.role !== 'comerciante') {
      throw new Error('User role is not recognized.');
    }
    if (!user.fullName.trim() || !user.email.trim()) {
      throw new Error('User needs a name and email.');
    }
    this.id = user.id;
    this.profileId = user.profileId;
    this.role = user.role;
    this.fullName = user.fullName.trim();
    this.email = user.email.trim();
  }
}
