import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EscrowBoard } from '../../components/escrow-board/escrow-board';

@Component({
  selector: 'app-escrow-board-view',
  imports: [EscrowBoard],
  template: '<app-escrow-board />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EscrowBoardView {}
