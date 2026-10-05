import { BaseEntity } from './base-entity';

/**
 * Account identity shown on the profile screen.
 * The id is numeric so the shared endpoint can update it with PUT, as in Learning Center.
 */
export class UserProfile implements BaseEntity {
  readonly id: number;
  readonly fullName: string;
  readonly phone: string;
  readonly document: string;
  readonly address: string;
  readonly email: string;
  readonly company: string;
  readonly ruc: string;
  readonly activity: string;

  constructor(profile: {
    id: number;
    fullName: string;
    phone: string;
    document: string;
    address: string;
    email: string;
    company?: string;
    ruc?: string;
    activity?: string;
  }) {
    if (!profile.fullName.trim()) {
      throw new Error('Profile name must not be empty.');
    }
    this.id = Number(profile.id);
    this.fullName = profile.fullName.trim();
    this.phone = profile.phone.trim();
    this.document = profile.document.trim();
    this.address = profile.address.trim();
    this.email = profile.email.trim();
    this.company = profile.company?.trim() ?? '';
    this.ruc = profile.ruc?.trim() ?? '';
    this.activity = profile.activity?.trim() ?? '';
  }
}
