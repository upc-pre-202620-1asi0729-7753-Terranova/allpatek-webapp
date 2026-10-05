import { Routes } from '@angular/router';
import { farmerOnly } from '../../shared/application/session.guard';

const climateBoard = () =>
  import('./views/climate-board-view/climate-board-view').then((m) => m.ClimateBoardView);

export const alertRoutes: Routes = [
  {
    path: '',
    loadComponent: climateBoard,
    canActivate: [farmerOnly],
    title: 'Allpatek - Alertas',
  },
];
