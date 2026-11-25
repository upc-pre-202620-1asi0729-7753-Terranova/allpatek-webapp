import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ProfileApi } from '../infrastructure/profile-api';
import { SessionStore } from './session.store';

function toLogin(session: SessionStore, router: Router) {
  session.clear();
  return router.createUrlTree(['/login']);
}

export const requireSession: CanActivateFn = () => {
  const session = inject(SessionStore);
  const router = inject(Router);
  if (session.signedIn()) {
    return true;
  }
  return toLogin(session, router);
};

/** Blocks the workspace until the API accepts the stored token. */
export const requireLiveSession: CanActivateFn = () => {
  const session = inject(SessionStore);
  const router = inject(Router);
  if (!session.signedIn()) {
    return toLogin(session, router);
  }
  return inject(ProfileApi)
    .getMe()
    .pipe(
      map(() => true),
      catchError((error: { status?: number }) => {
        if (error.status === 401) {
          return of(toLogin(session, router));
        }
        return of(true);
      }),
    );
};

export const farmerOnly: CanActivateFn = () => {
  const session = inject(SessionStore);
  const router = inject(Router);
  if (!session.signedIn()) {
    return toLogin(session, router);
  }
  if (session.role() === 'agricultor') {
    return true;
  }
  return inject(Router).createUrlTree(['/profile']);
};

export const merchantOnly: CanActivateFn = () => {
  const session = inject(SessionStore);
  const router = inject(Router);
  if (!session.signedIn()) {
    return toLogin(session, router);
  }
  if (session.role() === 'comerciante') {
    return true;
  }
  return inject(Router).createUrlTree(['/profile']);
};
