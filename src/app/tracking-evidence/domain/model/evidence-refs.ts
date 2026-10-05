/** Signed agreement this context reads by id. */
export class EvidenceAgreementRef {
  readonly id: string;
  readonly parcelId: string;
  readonly merchantName: string;
  readonly merchantProfileId: number | null;
  readonly merchantSigned: boolean;
  readonly farmerSigned: boolean;
  readonly createdAt: string;

  constructor(agreement: {
    id: string;
    parcelId?: string;
    merchantName?: string;
    merchantProfileId?: number | null;
    merchantSigned?: boolean;
    farmerSigned?: boolean;
    createdAt?: string;
  }) {
    this.id = String(agreement.id);
    this.parcelId = agreement.parcelId || this.id;
    this.merchantName = agreement.merchantName?.trim() ?? '';
    this.merchantProfileId =
      agreement.merchantProfileId != null && agreement.merchantProfileId > 0
        ? agreement.merchantProfileId
        : null;
    this.merchantSigned = agreement.merchantSigned ?? false;
    this.farmerSigned = agreement.farmerSigned ?? false;
    this.createdAt = /^\d{4}-\d{2}-\d{2}$/.test(agreement.createdAt ?? '') ? agreement.createdAt! : '';
  }
}

/** Parcel fields evidence screens need. Parcel Management owns the full entity. */
export class EvidenceParcelRef {
  readonly id: string;
  readonly ownerId: number;
  readonly name: string;
  readonly campaignCost: string;

  constructor(parcel: { id: string; ownerId?: number; name?: string; campaignCost?: string }) {
    this.id = String(parcel.id);
    this.ownerId = Number(parcel.ownerId) || 0;
    this.name = parcel.name?.trim() ?? '';
    this.campaignCost = parcel.campaignCost?.trim() ?? '';
  }
}
