import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EvidenceBoard } from '../../components/evidence-board/evidence-board';

@Component({
  selector: 'app-evidence-board-view',
  imports: [EvidenceBoard],
  template: '<app-evidence-board />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvidenceBoardView {}
