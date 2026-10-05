import { Routes } from '@angular/router';
import { farmerOnly, merchantOnly } from '../../shared/application/session.guard';

const board = () =>
  import('./views/evidence-board-view/evidence-board-view').then((m) => m.EvidenceBoardView);
const form = () =>
  import('./views/evidence-form-view/evidence-form-view').then((m) => m.EvidenceFormView);
const review = () =>
  import('./views/evidence-review-view/evidence-review-view').then((m) => m.EvidenceReviewView);

export const evidenceRoutes: Routes = [
  { path: '', loadComponent: board, title: 'Allpatek - Evidencias' },
  {
    path: 'new',
    loadComponent: form,
    canActivate: [farmerOnly],
    title: 'Allpatek - Subir evidencia',
  },
  {
    path: 'review',
    loadComponent: review,
    canActivate: [merchantOnly],
    title: 'Allpatek - Revisar evidencias',
  },
];
