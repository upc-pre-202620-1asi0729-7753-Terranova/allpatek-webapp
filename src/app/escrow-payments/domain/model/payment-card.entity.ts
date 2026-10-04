/**
 * The merchant's card. Only the last four digits are kept.
 * The opening balance is the amount the merchant says is on the card.
 */
export class PaymentCard {
  readonly id: string;
  readonly profileId: number;
  readonly holder: string;
  readonly last4: string;
  readonly expiry: string;
  readonly brand: string;
  readonly openingCents: number;

  constructor(card: {
    id: string;
    profileId: number;
    holder: string;
    last4: string;
    expiry: string;
    brand: string;
    openingCents: number;
  }) {
    if (!card.id.trim() || !Number.isInteger(card.profileId) || card.profileId < 1) {
      throw new Error('Card must belong to a merchant.');
    }
    if (!/^\d{4}$/.test(card.last4) || !card.holder.trim() || !/^\d{2}\/\d{2}$/.test(card.expiry)) {
      throw new Error('Card details are incomplete.');
    }
    if (!Number.isInteger(card.openingCents) || card.openingCents < 1) {
      throw new Error('Card balance must be greater than zero.');
    }
    this.id = card.id;
    this.profileId = card.profileId;
    this.holder = card.holder.trim();
    this.last4 = card.last4;
    this.expiry = card.expiry;
    this.brand = card.brand.trim() || 'Tarjeta';
    this.openingCents = card.openingCents;
  }
}
