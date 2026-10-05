import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { PaymentCard } from '../domain/model/payment-card.entity';
import { WalletsApiEndpoint } from './wallets-api-endpoint';

@Injectable({ providedIn: 'root' })
export class WalletApi extends BaseApi {
  readonly #walletsEndpoint = new WalletsApiEndpoint(this.http);

  getWallets(): Observable<PaymentCard[]> {
    return this.#walletsEndpoint.getAll();
  }

  createWallet(card: PaymentCard): Observable<PaymentCard> {
    return this.#walletsEndpoint.create(card);
  }

  updateWallet(card: PaymentCard): Observable<PaymentCard> {
    return this.#walletsEndpoint.update(card);
  }
}
