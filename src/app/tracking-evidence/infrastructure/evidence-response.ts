export interface EvidenceResource {
  id: string | number;
  parcelId?: string;
  milestone?: number;
  status?: string;
  notes?: string;
  fileName?: string;
  image?: string;
}

export interface EvidenceListResponse {
  evidence: EvidenceResource[];
}
