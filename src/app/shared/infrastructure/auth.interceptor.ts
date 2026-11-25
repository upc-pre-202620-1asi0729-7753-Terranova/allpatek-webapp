import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionStore } from '../application/session.store';

function statusOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error == null || !('status' in error)) {
    return undefined;
  }
  const status = (error as { status: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const router = inject(Router);
  const publicAuth = req.method === 'POST' && /\/(users|tokens)$/.test(req.url);
  const token = session.token();
  const authedReq =
    token && !publicAuth ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      if (statusOf(error) === 401 && !publicAuth) {
        session.clear();
        if (!router.url.startsWith('/login')) {
          void Promise.resolve().then(() => router.navigateByUrl('/login', { replaceUrl: true }));
        }
      }
      return throwError(() => error);
    }),
  );
};
