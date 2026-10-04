export interface WalletResource {
  id: string;
  profileId: number;
  holder: string;
  last4: string;
  expiry: string;
  brand: string;
  openingCents: number;
}

export interface WalletsResponse {
  wallets: WalletResource[];
}
