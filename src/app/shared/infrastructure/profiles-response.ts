import { BaseResource, BaseResponse } from './base-response';

export interface ProfileResource extends BaseResource {
  id: number;
  fullName: string;
  phone: string;
  document: string;
  address: string;
  email: string;
  company?: string;
  ruc?: string;
  activity?: string;
}

export interface ProfilesResponse extends BaseResponse {
  profiles: ProfileResource[];
}
