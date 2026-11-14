import { PaymentCard } from '../domain/model/payment-card.entity';
import { WalletResource, WalletsResponse } from './wallets-response';

export class WalletAssembler {
  toEntitiesFromResponse(response: WalletsResponse): PaymentCard[] {
    return response.wallets.flatMap((resource) => this.toEntityFromResource(resource) ?? []);
  }

  toEntityFromResource(resource: WalletResource): PaymentCard | null {
    const digits = (resource.number ?? '').replace(/\D/g, '');
    const last4 = resource.last4 || digits.slice(-4);
    if (!resource?.id || !resource.profileId || !/^\d{4}$/.test(last4)) {
      return null;
    }
    try {
      return new PaymentCard({
        id: String(resource.id),
        profileId: resource.profileId,
        holder: resource.holder,
        last4,
        number: digits.length === 16 ? digits : '',
        cvv: resource.cvv,
        expiry: resource.expiry,
        brand: resource.brand,
        openingCents: Number.isInteger(resource.openingCents) ? resource.openingCents : 0,
      });
    } catch {
      return null;
    }
  }

  toResourceFromEntity(entity: PaymentCard): WalletResource {
    return {
      id: entity.id,
      profileId: entity.profileId,
      holder: entity.holder,
      number: entity.number,
      cvv: entity.cvv,
      last4: entity.last4,
      expiry: entity.expiry,
      brand: entity.brand,
      openingCents: entity.openingCents,
    };
  }
}
