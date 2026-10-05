import { Routes } from '@angular/router';
import { requireSession } from './shared/application/session.guard';
import { Shell } from './shared/presentation/components/shell/shell';

const login = () => import('./shared/presentation/components/login/login').then((m) => m.Login);
const register = () =>
  import('./shared/presentation/components/register/register').then((m) => m.Register);
const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);
const profile = () => import('./shared/presentation/components/profile/profile').then((m) => m.Profile);
const agreementRoutes = () =>
  import('./agreements-management/presentation/agreement.routes').then((m) => m.agreementRoutes);

const baseTitle = 'Allpatek';

export const routes: Routes = [
  { path: 'login', loadComponent: login, title: `${baseTitle} - Sign in` },
  { path: 'register', loadComponent: register, title: `${baseTitle} - Register` },
  {
    path: '',
    component: Shell,
    canActivate: [requireSession],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profile' },
      { path: 'agreements', loadChildren: agreementRoutes },
      { path: 'profile', loadComponent: profile, title: `${baseTitle} - Perfil` },
    ],
  },
  { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Página no encontrada` },
];
