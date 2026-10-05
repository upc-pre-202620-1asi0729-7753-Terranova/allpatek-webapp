import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ParcelBoard } from '../../components/parcel-board/parcel-board';

@Component({
  selector: 'app-parcel-board-view',
  imports: [ParcelBoard],
  template: '<app-parcel-board />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParcelBoardView {}
