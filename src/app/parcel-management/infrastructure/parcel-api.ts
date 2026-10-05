import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Parcel } from '../domain/model/parcel.entity';
import { ParcelsApiEndpoint } from './parcels-api-endpoint';

@Injectable({ providedIn: 'root' })
export class ParcelApi extends BaseApi {
  readonly #parcelsEndpoint = new ParcelsApiEndpoint(this.http);

  getParcels(): Observable<Parcel[]> {
    return this.#parcelsEndpoint.getAll();
  }

  createParcel(parcel: Parcel): Observable<Parcel> {
    return this.#parcelsEndpoint.create(parcel);
  }

  updateParcel(parcel: Parcel): Observable<Parcel> {
    return this.#parcelsEndpoint.update(parcel);
  }

  deleteParcel(id: string): Observable<void> {
    return this.#parcelsEndpoint.delete(id);
  }
}
