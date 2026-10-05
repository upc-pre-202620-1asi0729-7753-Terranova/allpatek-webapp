export interface AgreementResource {
  id: string;
  parcelId: string;
  merchantName?: string;
  merchantProfileId?: number | null;
  merchantSigned?: boolean;
  farmerSigned?: boolean;
  createdAt?: string;
}

export interface AgreementsResponse {
  agreements: AgreementResource[];
}
