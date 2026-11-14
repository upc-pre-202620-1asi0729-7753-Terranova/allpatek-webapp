import { Agreement } from '../domain/model/agreement.entity';
import { AgreementResource, AgreementsResponse } from './agreements-response';

export class AgreementAssembler {
  toEntitiesFromResponse(response: AgreementsResponse): Agreement[] {
    return response.agreements.flatMap((resource) => this.toEntityFromResource(resource) ?? []);
  }

  toEntityFromResource(resource: AgreementResource): Agreement | null {
    if (!resource?.id || !resource.parcelId) {
      return null;
    }
    try {
      return new Agreement({
        id: String(resource.id),
        parcelId: resource.parcelId,
        merchantName: resource.merchantName,
        merchantProfileId: resource.merchantProfileId,
        merchantSigned: resource.merchantSigned,
        farmerSigned: resource.farmerSigned,
        createdAt: resource.createdAt,
      });
    } catch {
      return null;
    }
  }

  toResourceFromEntity(entity: Agreement): AgreementResource {
    return {
      id: entity.id,
      parcelId: entity.parcelId,
      merchantName: entity.merchantName,
      merchantProfileId: entity.merchantProfileId,
      merchantSigned: entity.merchantSigned,
      farmerSigned: entity.farmerSigned,
      createdAt: entity.createdAt,
    };
  }
}
