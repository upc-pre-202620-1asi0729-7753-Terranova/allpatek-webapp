/**
 * A registered agricultural parcel in the Parcel Management bounded context.
 */
export class Parcel {
  readonly id: string;
  readonly ownerId: number;
  readonly name: string;
  readonly status: 'available' | 'in-production' | 'maintenance';
  readonly area: string;
  readonly location: string;
  readonly soilType: string;
  readonly campaignCost: string;
  readonly durationMonths: number;
  readonly startMonth: string;
  readonly crops: readonly string[];
  readonly imageUrl: string;
  readonly images: readonly string[];

  constructor(parcel: {
    id: string;
    ownerId: number;
    name: string;
    status: Parcel['status'];
    area: string;
    location: string;
    soilType: string;
    campaignCost: string;
    durationMonths?: number;
    startMonth?: string;
    crops?: readonly string[];
    imageUrl: string;
    images?: readonly string[];
  }) {
    if (!parcel.name.trim()) {
      throw new Error('Parcel name must not be empty.');
    }
    this.id = parcel.id;
    this.ownerId = parcel.ownerId;
    this.name = parcel.name.trim();
    this.status = parcel.status;
    this.area = parcel.area;
    this.location = parcel.location;
    this.soilType = parcel.soilType;
    this.campaignCost = parcel.campaignCost;
    this.durationMonths = parcel.durationMonths && parcel.durationMonths > 0 ? parcel.durationMonths : 0;
    this.startMonth = parcel.startMonth ?? '';
    this.crops = parcel.crops ?? [];
    this.imageUrl = parcel.imageUrl;
    this.images = parcel.images?.length ? parcel.images : parcel.imageUrl ? [parcel.imageUrl] : [];
  }
}
