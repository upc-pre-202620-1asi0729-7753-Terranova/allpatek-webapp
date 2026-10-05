/** Parcel coordinates this context reads by id. Parcel Management owns the full entity. */
export class ParcelRef {
  readonly id: string;
  readonly ownerId: number;
  readonly name: string;
  readonly location: string;

  constructor(parcel: { id: string; ownerId?: number; name?: string; location?: string }) {
    this.id = String(parcel.id);
    this.ownerId = Number(parcel.ownerId) || 0;
    this.name = parcel.name?.trim() ?? '';
    this.location = parcel.location?.trim() ?? '';
  }
}
