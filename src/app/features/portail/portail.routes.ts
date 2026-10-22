import type { Routes } from '@angular/router';

export const PORTAIL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./portail-placeholder.component').then(
        (module) => module.PortailPlaceholderComponent,
      ),
    title: 'Espace contribuable — PDREF',
  },
];
