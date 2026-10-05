import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Brand mark shown on shared screens.
 */
@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
  styleUrl: './logo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo {
  readonly compact = input(false);
}
