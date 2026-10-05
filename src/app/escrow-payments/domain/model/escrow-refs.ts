/** Signed agreement this vault reads by id. */
export class EscrowAgreementRef {
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

/** Parcel fields the vault needs. Parcel Management owns the full entity. */
export class EscrowParcelRef {
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

/** Milestone evidence the vault reads and marks as paid. */
export class EscrowEvidenceRef {
  readonly id: string;
  readonly parcelId: string;
  readonly milestone: number;
  readonly status: 'review' | 'verified' | 'accepted';

  constructor(evidence: {
    id: string;
    parcelId: string;
    milestone: number;
    status?: 'review' | 'verified' | 'accepted';
  }) {
    this.id = String(evidence.id);
    this.parcelId = evidence.parcelId;
    this.milestone = evidence.milestone;
    this.status =
      evidence.status === 'accepted' ? 'accepted' : evidence.status === 'verified' ? 'verified' : 'review';
  }
}
