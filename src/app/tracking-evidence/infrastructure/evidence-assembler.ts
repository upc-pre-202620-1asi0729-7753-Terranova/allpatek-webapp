import { MilestoneEvidence } from '../domain/model/milestone-evidence.entity';
import { EvidenceListResponse, EvidenceResource } from './evidence-response';

export class EvidenceAssembler {
  toEntitiesFromResponse(response: EvidenceListResponse): MilestoneEvidence[] {
    return response.evidence.flatMap((resource) => this.toEntityFromResource(resource) ?? []);
  }

  toEntityFromResource(resource: EvidenceResource): MilestoneEvidence | null {
    if (!resource.parcelId || !resource.milestone) {
      return null;
    }
    return new MilestoneEvidence({
      id: String(resource.id),
      parcelId: resource.parcelId,
      milestone: resource.milestone,
      status:
        resource.status === 'accepted' ? 'accepted' : resource.status === 'verified' ? 'verified' : 'review',
      notes: resource.notes,
      fileName: resource.fileName,
      image: resource.image,
    });
  }

  toResourceFromEntity(entity: MilestoneEvidence): EvidenceResource {
    return {
      id: entity.id,
      parcelId: entity.parcelId,
      milestone: entity.milestone,
      status: entity.status,
      notes: entity.notes,
      fileName: entity.fileName,
      image: entity.image,
    };
  }
}
