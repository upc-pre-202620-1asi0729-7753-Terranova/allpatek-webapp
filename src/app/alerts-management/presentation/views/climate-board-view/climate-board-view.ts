import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ClimateBoard } from '../../components/climate-board/climate-board';

@Component({
  selector: 'app-climate-board-view',
  imports: [ClimateBoard],
  template: '<app-climate-board />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateBoardView {}
