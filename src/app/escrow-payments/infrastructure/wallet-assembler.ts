import { PaymentCard } from '../domain/model/payment-card.entity';
import { WalletResource, WalletsResponse } from './wallets-response';

export class WalletAssembler {
  toEntitiesFromResponse(response: WalletsResponse): PaymentCard[] {
    return response.wallets.flatMap((resource) => this.toEntityFromResource(resource) ?? []);
  }

  toEntityFromResource(resource: WalletResource): PaymentCard | null {
    if (!resource?.id || !resource.profileId || !resource.last4) {
      return null;
    }
    return new PaymentCard({
      id: String(resource.id),
      profileId: resource.profileId,
      holder: resource.holder,
      last4: resource.last4,
      expiry: resource.expiry,
      brand: resource.brand,
      openingCents: resource.openingCents,
    });
  }

  toResourceFromEntity(entity: PaymentCard): WalletResource {
    return {
      id: entity.id,
      profileId: entity.profileId,
      holder: entity.holder,
      last4: entity.last4,
      expiry: entity.expiry,
      brand: entity.brand,
      openingCents: entity.openingCents,
    };
  }
}
