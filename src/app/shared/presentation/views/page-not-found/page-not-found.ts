import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-page-not-found',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageNotFound {
  protected readonly path = inject(Router).url;
}
