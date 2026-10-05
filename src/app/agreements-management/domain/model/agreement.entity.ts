/**
 * Signature state of one parcel contract.
 * The merchant signs first. The farmer then finds that request and signs.
 */
export class Agreement {
  readonly id: string;
  readonly parcelId: string;
  readonly merchantName: string;
  readonly merchantProfileId: number | null;
  readonly merchantSigned: boolean;
  readonly farmerSigned: boolean;
  readonly createdAt: string;

  constructor(agreement: {
    id: string;
    parcelId: string;
    merchantName?: string;
    merchantProfileId?: number | null;
    merchantSigned?: boolean;
    farmerSigned?: boolean;
    createdAt?: string;
  }) {
    if (!agreement.id.trim() || !agreement.parcelId.trim()) {
      throw new Error('Agreement must belong to a parcel.');
    }
    this.id = agreement.id;
    this.parcelId = agreement.parcelId;
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
