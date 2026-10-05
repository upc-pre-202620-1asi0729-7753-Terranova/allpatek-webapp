import { Routes } from '@angular/router';
import { farmerOnly } from '../../shared/application/session.guard';

const contractSign = () =>
  import('./views/contract-sign-view/contract-sign-view').then((m) => m.ContractSignView);
const merchantDetail = () =>
  import('./views/merchant-detail-view/merchant-detail-view').then((m) => m.MerchantDetailView);

export const agreementRoutes: Routes = [
  { path: '', loadComponent: contractSign, title: 'Allpatek - Contrato' },
  {
    path: 'merchant',
    loadComponent: merchantDetail,
    canActivate: [farmerOnly],
    title: 'Allpatek - Detalle del comerciante',
  },
];
