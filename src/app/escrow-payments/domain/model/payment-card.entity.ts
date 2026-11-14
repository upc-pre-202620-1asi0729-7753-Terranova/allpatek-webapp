/**
 * The merchant's card. The vault shows the last four digits.
 * The full number and CVV travel only on save, because the API requires them.
 * The opening balance is the amount the merchant says is on the card.
 */
export class PaymentCard {
  readonly id: string;
  readonly profileId: number;
  readonly holder: string;
  readonly last4: string;
  readonly number: string;
  readonly cvv: string;
  readonly expiry: string;
  readonly brand: string;
  readonly openingCents: number;

  constructor(card: {
    id: string;
    profileId: number;
    holder: string;
    last4: string;
    number?: string;
    cvv?: string;
    expiry: string;
    brand: string;
    openingCents: number;
  }) {
    const number = (card.number ?? '').replace(/\D/g, '');
    const cvv = (card.cvv ?? '').replace(/\D/g, '');
    if (!card.id.trim() || !Number.isInteger(card.profileId) || card.profileId < 1) {
      throw new Error('Card must belong to a merchant.');
    }
    if (!/^\d{4}$/.test(card.last4) || !card.holder.trim() || !/^\d{2}\/\d{2}$/.test(card.expiry)) {
      throw new Error('Card details are incomplete.');
    }
    if (number && number.length !== 16) {
      throw new Error('Card number must be 16 digits.');
    }
    if (cvv && (cvv.length < 3 || cvv.length > 4)) {
      throw new Error('CVV must be 3 or 4 digits.');
    }
    if (!Number.isInteger(card.openingCents) || card.openingCents < 0) {
      throw new Error('Card balance must be a non-negative amount.');
    }
    this.id = card.id;
    this.profileId = card.profileId;
    this.holder = card.holder.trim();
    this.last4 = card.last4;
    this.number = number;
    this.cvv = cvv;
    this.expiry = card.expiry;
    this.brand = card.brand.trim() || 'Tarjeta';
    this.openingCents = card.openingCents;
  }
}
