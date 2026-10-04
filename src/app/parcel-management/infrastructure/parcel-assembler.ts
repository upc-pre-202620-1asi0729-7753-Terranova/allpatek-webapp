import { Parcel } from '../domain/model/parcel.entity';
import { ParcelResource, ParcelsResponse } from './parcels-response';

export class ParcelAssembler {
  toEntitiesFromResponse(response: ParcelsResponse): Parcel[] {
    return response.parcels.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: ParcelResource): Parcel {
    return new Parcel({
      id: resource.id,
      ownerId: resource.ownerId ?? 0,
      name: resource.name,
      status: resource.status,
      area: resource.area,
      location: resource.location,
      soilType: resource.soilType,
      campaignCost: resource.campaignCost,
      durationMonths: resource.durationMonths,
      startMonth: resource.startMonth,
      crops: resource.crops,
      imageUrl: resource.imageUrl,
      images: resource.images,
    });
  }

  toResourceFromEntity(entity: Parcel): ParcelResource {
    return {
      id: entity.id,
      ownerId: entity.ownerId,
      name: entity.name,
      status: entity.status,
      area: entity.area,
      location: entity.location,
      soilType: entity.soilType,
      campaignCost: entity.campaignCost,
      durationMonths: entity.durationMonths,
      startMonth: entity.startMonth,
      crops: [...entity.crops],
      imageUrl: entity.imageUrl,
      images: [...entity.images],
    };
  }
}
