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
        path: 'admin/workflows',
        loadComponent: () =>
          import('../workflows/workflows-page.component').then(
            (module) => module.WorkflowsPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Workflows_Read'], breadcrumb: 'Workflows' },
        title: 'Workflows - Administration PDREF',
      },
      {
        path: 'admin/directions',
        loadComponent: () =>
          import('../admin/admin-page.component').then((module) => module.AdminPageComponent),
        canActivate: [accessGuard],
        data: { permissions: ['Directions_Read'], screen: 'directions', breadcrumb: 'Directions' },
        title: 'Directions - Administration PDREF',
      },
      {
        path: 'admin/exercices',
        loadComponent: () =>
          import('../admin/admin-page.component').then((module) => module.AdminPageComponent),
        canActivate: [accessGuard],
        data: { permissions: ['Exercices_Read'], screen: 'exercices', breadcrumb: 'Exercices' },
        title: 'Exercices fiscaux - Administration PDREF',
      },
      {
        path: 'admin/listes-valeurs',
        loadComponent: () =>
          import('../admin/admin-page.component').then((module) => module.AdminPageComponent),
        canActivate: [accessGuard],
        data: {
          permissions: ['Listes_Read'],
          screen: 'listes-valeurs',
          breadcrumb: 'Listes de valeurs',
        },
        title: 'Listes de valeurs - Administration PDREF',
      },
      {
        path: 'admin/parametres',
        loadComponent: () =>
          import('../admin/admin-page.component').then((module) => module.AdminPageComponent),
        canActivate: [accessGuard],
        data: { permissions: ['Parametres_Read'], screen: 'parametres', breadcrumb: 'Parametres' },
        title: 'Parametres - Administration PDREF',
      },
      {
        path: 'admin/modeles-notifications',
        loadComponent: () =>
          import('../admin/admin-page.component').then((module) => module.AdminPageComponent),
        canActivate: [accessGuard],
        data: {
          permissions: ['ModelesNotifications_Read'],
          screen: 'modeles-notifications',
          breadcrumb: 'Modeles de notification',
        },
        title: 'Modeles de notification - Administration PDREF',
      },
      {
        path: 'files',
        loadComponent: () =>
          import('../files/files-page.component').then((module) => module.FilesPageComponent),
        canActivate: [accessGuard],
        data: { permissions: ['Files_Read'], breadcrumb: 'Fichiers' },
        title: 'Fichiers - PDREF',
      },
      {
        path: 'courriers',
        loadComponent: () =>
          import('../courriers/courriers-page.component').then(
            (module) => module.CourriersPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Courriers_Read'], breadcrumb: 'Courriers' },
        title: 'Courriers - PDREF',
      },
      {
        path: 'courriers/nouveau',
        loadComponent: () =>
          import('../courriers/courrier-form-page.component').then(
            (module) => module.CourrierFormPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Courriers_Create'], breadcrumb: 'Nouveau courrier' },
        title: 'Nouveau courrier - PDREF',
      },
      {
        path: 'courriers/:id/modifier',
        loadComponent: () =>
          import('../courriers/courrier-form-page.component').then(
            (module) => module.CourrierFormPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Courriers_Update'],
          breadcrumb: 'Modifier le courrier',
          renderMode: 'client',
        },
        title: 'Modifier le courrier - PDREF',
      },
      {
        path: 'courriers/:id',
        loadComponent: () =>
          import('../courriers/courrier-detail-page.component').then(
            (module) => module.CourrierDetailPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Courriers_Read'],
          breadcrumb: 'Fiche courrier',
          renderMode: 'client',
        },
        title: 'Fiche courrier - PDREF',
      },
      {
        path: 'contribuables',
        loadComponent: () =>
          import('../contribuables/contribuables-page.component').then(
            (module) => module.ContribuablesPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Contribuables_Read'], breadcrumb: 'Contribuables' },
        title: 'Contribuables - PDREF',
      },
      {
        path: 'contribuables/nouveau',
        loadComponent: () =>
          import('../contribuables/contribuable-form-page.component').then(
            (module) => module.ContribuableFormPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Contribuables_Create'], breadcrumb: 'Nouveau contribuable' },
        title: 'Nouveau contribuable - PDREF',
      },
      {
        path: 'contribuables/:id/modifier',
        loadComponent: () =>
          import('../contribuables/contribuable-form-page.component').then(
            (module) => module.ContribuableFormPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Contribuables_Update'],
          breadcrumb: 'Modifier le contribuable',
          renderMode: 'client',
        },
        title: 'Modifier le contribuable - PDREF',
      },
      {
        path: 'contribuables/:id',
        loadComponent: () =>
          import('../contribuables/contribuable-detail-page.component').then(
            (module) => module.ContribuableDetailPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Contribuables_Read'],
          breadcrumb: 'Fiche contribuable',
          renderMode: 'client',
        },
        title: 'Fiche contribuable - PDREF',
      },
      {
        path: 'my-notifications',
        loadComponent: () =>
          import('../notifications/my-notifications-page.component').then(
            (module) => module.MyNotificationsPageComponent,
          ),
        title: 'Mes notifications - PDREF',
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
