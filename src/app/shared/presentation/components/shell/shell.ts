import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { ProfileStore } from '../../../application/profile.store';
import { SessionStore } from '../../../application/session.store';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { Logo } from '../logo/logo';

interface NavItem {
  labelKey: string;
  icon: string;
  link: string;
}

interface CrumbLink {
  labelKey: string;
  path: string;
}

/**
 * Workspace layout. Child routes render the bounded-context screens.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo, TranslatePipe, LanguageSwitcher],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  readonly #router = inject(Router);
  readonly #session = inject(SessionStore);
  readonly #profile = inject(ProfileStore);

  protected readonly role = this.#session.role;
  protected readonly displayName = computed(() => this.#profile.profile()?.fullName ?? '');
  protected readonly initials = computed(() => {
    const parts = this.displayName().split(/\s+/).filter(Boolean);
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  });

  readonly #url = toSignal(
    this.#router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.#router.url },
  );

  protected readonly navigation = computed<NavItem[]>(() =>
    this.role() === 'comerciante'
      ? [
          { labelKey: 'nav.parcels', icon: 'assets/workspace/nav-parcels.svg', link: '/parcels' },
          { labelKey: 'nav.escrow', icon: 'assets/workspace/nav-escrow.svg', link: '/escrow' },
          {
            labelKey: 'nav.evidence',
            icon: 'assets/workspace/nav-tracking.svg',
            link: '/evidence',
          },
        ]
      : [
          { labelKey: 'nav.myParcels', icon: 'assets/workspace/nav-parcels.svg', link: '/parcels' },
          {
            labelKey: 'nav.agreements',
            icon: 'assets/workspace/nav-agreements.svg',
            link: '/agreements',
          },
          { labelKey: 'nav.escrow', icon: 'assets/workspace/nav-escrow.svg', link: '/escrow' },
          {
            labelKey: 'nav.evidence',
            icon: 'assets/workspace/nav-tracking.svg',
            link: '/evidence',
          },
          { labelKey: 'nav.alerts', icon: 'assets/workspace/nav-alerts.svg', link: '/alerts' },
        ],
  );

  protected readonly trail = computed(() => {
    const parsed = this.#router.parseUrl(this.#url());
    const segments = parsed.root.children['primary']?.segments.map((segment) => segment.path) ?? [];
    const path = segments.join('/');
    const parcelName = parsed.queryParams['parcel'] ?? '';

    if (segments[0] === 'parcels' && segments[1] === 'new') {
      return this.#trail([{ labelKey: 'nav.myParcels', path: '/parcels' }], 'crumb.newParcel');
    }
    if (segments[0] === 'parcels' && segments[2] === 'edit') {
      return this.#trail([{ labelKey: 'nav.myParcels', path: '/parcels' }], 'crumb.editParcel');
    }
    if (segments[0] === 'parcels' && segments[1]) {
      return this.#trail([{ labelKey: 'nav.myParcels', path: '/parcels' }], 'crumb.parcelDetail');
    }
    if (path === 'profile') {
      return this.#trail([], 'crumb.profile');
    }
    if (path === 'agreements/merchant') {
      return this.#trail([{ labelKey: 'nav.agreements', path: '/agreements' }], 'crumb.merchantDetail');
    }
    if (path === 'agreements') {
      return this.#trail([], 'crumb.contract');
    }
    if (path === 'escrow/deposit') {
      return this.#trail([{ labelKey: 'nav.escrow', path: '/escrow' }], 'crumb.deposit');
    }
    if (path === 'escrow') {
      return this.#trail([], 'crumb.escrow');
    }
    if (path === 'evidence/new') {
      return this.#trail([{ labelKey: 'nav.evidence', path: '/evidence' }], 'crumb.newEvidence', parcelName);
    }
    if (path === 'evidence/review') {
      return this.#trail(
        [{ labelKey: 'nav.evidence', path: '/evidence' }],
        'crumb.reviewEvidence',
        parcelName,
      );
    }
    if (path === 'evidence') {
      return this.#trail([], 'crumb.evidence');
    }
    if (path === 'alerts') {
      return this.#trail([], 'crumb.alerts');
    }
    return this.#trail([], 'crumb.profile');
  });

  protected logout(): void {
    this.#session.clear();
    void this.#router.navigate(['/login']);
  }

  #trail(
    links: CrumbLink[],
    currentKey: string,
    extra = '',
  ): { links: CrumbLink[]; currentKey: string; extra: string } {
    return { links, currentKey, extra };
  }
}
