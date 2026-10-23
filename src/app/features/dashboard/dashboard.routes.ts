import type { Routes } from '@angular/router';
import { accessGuard } from '../../core/guards/access.guard';
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
        title: 'PDREF - Fondations',
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('../audit/audit-list.component').then((module) => module.AuditListComponent),
        canActivate: [accessGuard],
        data: { permissions: ['Audit_Read'], breadcrumb: 'Audit' },
        title: "Journal d'audit - PDREF",
      },
    ],
  },
];
