import type { Routes } from '@angular/router';
import { DashboardShellComponent } from './shell/dashboard-shell.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./home/dashboard-home.component').then((module) => module.DashboardHomeComponent),
        title: 'PDREF — Fondations',
      },
    ],
  },
];
