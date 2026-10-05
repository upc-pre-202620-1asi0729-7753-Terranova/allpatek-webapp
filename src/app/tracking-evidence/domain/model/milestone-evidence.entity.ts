/** Evidence the farmer sends for one escrow milestone of a parcel. */
export class MilestoneEvidence {
  readonly id: string;
  readonly parcelId: string;
  readonly milestone: number;
  readonly status: 'review' | 'verified' | 'accepted';
  readonly notes: string;
  readonly fileName: string;
  readonly image: string;

  constructor(evidence: {
    id: string;
    parcelId: string;
    milestone: number;
    status?: 'review' | 'verified' | 'accepted';
    notes?: string;
    fileName?: string;
    image?: string;
  }) {
    if (!evidence.id.trim() || !evidence.parcelId.trim() || evidence.milestone < 1 || evidence.milestone > 4) {
      throw new Error('Evidence must belong to a parcel milestone.');
    }
    this.id = evidence.id;
    this.parcelId = evidence.parcelId;
    this.milestone = evidence.milestone;
    this.status =
      evidence.status === 'accepted' ? 'accepted' : evidence.status === 'verified' ? 'verified' : 'review';
    this.notes = evidence.notes?.trim() ?? '';
    this.fileName = evidence.fileName?.trim() ?? '';
    this.image = evidence.image ?? '';
  }
}

/** The first milestone the farmer may send. Null while one is waiting for the merchant. */
export function openMilestone(items: readonly MilestoneEvidence[]): number | null {
  for (const milestone of [1, 2, 3, 4]) {
    const item = items.find((evidence) => evidence.milestone === milestone);
    if (!item) {
      return milestone;
    }
    if (item.status === 'review' || item.status === 'verified') {
      return null;
    }
  }
  return null;
}
