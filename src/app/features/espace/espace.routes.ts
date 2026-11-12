import type { Routes } from '@angular/router';
import { accessGuard } from '../../core/guards/access.guard';
import { adhesionFeatureGuard } from '../../core/guards/adhesion-feature.guard';
import { authGuard } from '../../core/guards/auth.guard';
import { depotFeatureGuard } from '../../core/guards/depot-feature.guard';
import { mustChangePasswordGuard } from '../../core/guards/must-change-password.guard';
import { EspaceShellComponent } from './espace-shell.component';

export const ESPACE_ROUTES: Routes = [
  {
    path: '',
    component: EspaceShellComponent,
    canActivate: [adhesionFeatureGuard, authGuard, mustChangePasswordGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./espace-dossiers-page.component').then(
            (module) => module.EspaceDossiersPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Demandes_ReadOwn'], breadcrumb: 'Mes dossiers' },
        title: 'Mes dossiers - PDREF',
      },
      {
        path: 'depots/nouveau',
        loadComponent: () =>
          import('./depot-wizard-page.component').then((module) => module.DepotWizardPageComponent),
        canActivate: [depotFeatureGuard, accessGuard],
        data: {
          permissions: ['Demandes_Depose'],
          breadcrumb: 'Nouveau depot',
          renderMode: 'client',
        },
        title: 'Nouveau depot - PDREF',
      },
      {
        path: 'depots/:id',
        loadComponent: () =>
          import('./depot-wizard-page.component').then((module) => module.DepotWizardPageComponent),
        canActivate: [depotFeatureGuard, accessGuard],
        data: {
          permissions: ['Demandes_Depose'],
          breadcrumb: 'Depot en cours',
          renderMode: 'client',
        },
        title: 'Depot en cours - PDREF',
      },
      {
        path: 'dossiers/:id',
        loadComponent: () =>
          import('./espace-dossier-page.component').then(
            (module) => module.EspaceDossierPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Demandes_ReadOwn'],
          breadcrumb: 'Dossier',
          renderMode: 'client',
        },
        title: 'Dossier - PDREF',
      },
    ],
  },
];
