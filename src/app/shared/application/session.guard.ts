import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from './session.store';

export const requireSession: CanActivateFn = () => {
  const session = inject(SessionStore);
  if (session.role()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login']);
};

export const farmerOnly: CanActivateFn = () => {
  const session = inject(SessionStore);
  if (session.role() === 'agricultor') {
    return true;
  }
  return inject(Router).createUrlTree(['/profile']);
};

export const merchantOnly: CanActivateFn = () => {
  const session = inject(SessionStore);
  if (session.role() === 'comerciante') {
    return true;
  }
  return inject(Router).createUrlTree(['/profile']);
};
