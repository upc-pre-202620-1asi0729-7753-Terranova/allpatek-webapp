import { Agreement } from '../domain/model/agreement.entity';
import { AgreementResource, AgreementsResponse } from './agreements-response';

export class AgreementAssembler {
  toEntitiesFromResponse(response: AgreementsResponse): Agreement[] {
    return response.agreements.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: AgreementResource): Agreement {
    return new Agreement({
      id: String(resource.id),
      parcelId: resource.parcelId || String(resource.id),
      merchantName: resource.merchantName,
      merchantProfileId: resource.merchantProfileId,
      merchantSigned: resource.merchantSigned,
      farmerSigned: resource.farmerSigned,
      createdAt: resource.createdAt,
    });
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
