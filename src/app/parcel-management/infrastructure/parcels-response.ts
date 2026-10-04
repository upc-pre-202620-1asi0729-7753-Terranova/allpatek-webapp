import { Parcel } from '../domain/model/parcel.entity';

export interface ParcelsResponse {
  parcels: ParcelResource[];
}

export interface ParcelResource {
  id: string;
  ownerId?: number;
  name: string;
  status: Parcel['status'];
  area: string;
  location: string;
  soilType: string;
  campaignCost: string;
  durationMonths?: number;
  startMonth?: string;
  crops?: string[];
  imageUrl: string;
  images?: string[];
}
