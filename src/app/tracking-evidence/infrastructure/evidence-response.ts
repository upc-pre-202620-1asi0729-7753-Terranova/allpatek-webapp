export interface EvidenceResource {
  id: string | number;
  parcelId?: string;
  agreementId?: string;
  milestone?: number;
  status?: string;
  notes?: string;
  fileName?: string;
  image?: string;
}

export interface EvidenceListResponse {
  evidence: EvidenceResource[];
}
