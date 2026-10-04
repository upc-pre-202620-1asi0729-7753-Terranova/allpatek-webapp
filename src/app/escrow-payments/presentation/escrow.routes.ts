import { Routes } from '@angular/router';
import { merchantOnly } from '../../shared/application/session.guard';

const vault = () =>
  import('./views/escrow-board-view/escrow-board-view').then((m) => m.EscrowBoardView);
const deposit = () =>
  import('./views/deposit-form-view/deposit-form-view').then((m) => m.DepositFormView);

export const escrowRoutes: Routes = [
  { path: '', loadComponent: vault, title: 'Allpatek - Bóveda' },
  {
    path: 'deposit',
    loadComponent: deposit,
    canActivate: [merchantOnly],
    title: 'Allpatek - Depositar fondos',
  },
];
