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
const alertRoutes = () =>
  import('./alerts-management/presentation/alert.routes').then((m) => m.alertRoutes);
const escrowRoutes = () =>
  import('./escrow-payments/presentation/escrow.routes').then((m) => m.escrowRoutes);
const parcelRoutes = () =>
  import('./parcel-management/presentation/parcel.routes').then((m) => m.parcelRoutes);

const baseTitle = 'Allpatek';

export const routes: Routes = [
  { path: 'login', loadComponent: login, title: `${baseTitle} - Sign in` },
  { path: 'register', loadComponent: register, title: `${baseTitle} - Register` },
  {
    path: '',
    component: Shell,
    canActivate: [requireSession],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'parcels' },
      { path: 'parcels', loadChildren: parcelRoutes },
      { path: 'agreements', loadChildren: agreementRoutes },
      { path: 'alerts', loadChildren: alertRoutes },
      { path: 'escrow', loadChildren: escrowRoutes },
      { path: 'profile', loadComponent: profile, title: `${baseTitle} - Perfil` },
    ],
  },
  { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Página no encontrada` },
];
