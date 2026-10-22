import type { Routes } from '@angular/router';

export const PORTAIL_PUBLIC_ROUTES: Routes = [
  {
    path: 'suivi',
    loadComponent: () =>
      import('./portail-public.component').then((module) => module.PortailPublicComponent),
    title: 'Suivi public — PDREF',
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'suivi',
  },
];
