import { Routes } from '@angular/router';
import { farmerOnly } from '../../shared/application/session.guard';

const parcelBoard = () =>
  import('./views/parcel-board-view/parcel-board-view').then((m) => m.ParcelBoardView);
const parcelForm = () =>
  import('./views/parcel-form-view/parcel-form-view').then((m) => m.ParcelFormView);
const parcelDetail = () =>
  import('./views/parcel-detail-view/parcel-detail-view').then((m) => m.ParcelDetailView);

export const parcelRoutes: Routes = [
  { path: '', loadComponent: parcelBoard, title: 'Allpatek - Parcels' },
  {
    path: 'new',
    loadComponent: parcelForm,
    canActivate: [farmerOnly],
    title: 'Allpatek - Registrar parcela',
  },
  {
    path: ':id/edit',
    loadComponent: parcelForm,
    canActivate: [farmerOnly],
    title: 'Allpatek - Editar parcela',
  },
  { path: ':id', loadComponent: parcelDetail, title: 'Allpatek - Detalle de parcela' },
];
