import type { Routes } from '@angular/router';
import { accessGuard } from '../../core/guards/access.guard';
import { adhesionFeatureGuard } from '../../core/guards/adhesion-feature.guard';
import { authGuard } from '../../core/guards/auth.guard';
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
