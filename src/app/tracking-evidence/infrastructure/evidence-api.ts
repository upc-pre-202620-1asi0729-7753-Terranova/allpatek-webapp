import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { MilestoneEvidence } from '../domain/model/milestone-evidence.entity';
import { EvidenceApiEndpoint } from './evidence-api-endpoint';

@Injectable({ providedIn: 'root' })
export class EvidenceApi extends BaseApi {
  readonly #evidenceEndpoint = new EvidenceApiEndpoint(this.http);

  getEvidence(): Observable<MilestoneEvidence[]> {
    return this.#evidenceEndpoint.getAll();
  }

  createEvidence(evidence: MilestoneEvidence): Observable<MilestoneEvidence> {
    return this.#evidenceEndpoint.create(evidence);
  }

  updateEvidence(evidence: MilestoneEvidence): Observable<MilestoneEvidence> {
    return this.#evidenceEndpoint.update(evidence);
  }
}
