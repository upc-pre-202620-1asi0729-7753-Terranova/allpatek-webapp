/**
 * Parcel data this context reads by id. Parcel Management owns the full entity.
 */
export class ParcelRef {
  readonly id: string;
  readonly ownerId: number;
  readonly name: string;
  readonly area: string;
  readonly campaignCost: string;
  readonly crops: readonly string[];

  constructor(parcel: {
    id: string;
    ownerId?: number;
    name?: string;
    area?: string;
    campaignCost?: string;
    crops?: readonly string[];
  }) {
    this.id = String(parcel.id);
    this.ownerId = Number(parcel.ownerId) || 0;
    this.name = parcel.name?.trim() ?? '';
    this.area = parcel.area?.trim() ?? '';
    this.campaignCost = parcel.campaignCost?.trim() ?? '';
    this.crops = parcel.crops ?? [];
  }
}
