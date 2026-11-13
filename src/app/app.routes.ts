import type { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { mustChangePasswordGuard } from './core/guards/must-change-password.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'design-system-demo',
    loadComponent: () =>
      import('./features/design-system/design-system-demo.component').then(
        (module) => module.DesignSystemDemoComponent,
      ),
    title: 'Design system — PDREF',
    data: { breadcrumb: 'Design system' },
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((module) => module.AUTH_ROUTES),
  },
  {
    path: 'suivi',
    loadComponent: () =>
      import('./features/portail-public/portail-public.component').then(
        (module) => module.PortailPublicComponent,
      ),
    title: 'Suivi public - PDREF',
  },
  {
    path: 'portail-public',
    loadChildren: () =>
      import('./features/portail-public/portail-public.routes').then(
        (module) => module.PORTAIL_PUBLIC_ROUTES,
      ),
  },
  {
    path: 'adhesion',
    loadChildren: () =>
      import('./features/adhesion/adhesion.routes').then((module) => module.ADHESION_ROUTES),
  },
  {
    path: 'espace',
    loadChildren: () =>
      import('./features/espace/espace.routes').then((module) => module.ESPACE_ROUTES),
  },
  {
    path: 'portail',
    loadChildren: () =>
      import('./features/portail/portail.routes').then((module) => module.PORTAIL_ROUTES),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((module) => module.DASHBOARD_ROUTES),
    canActivate: [authGuard, mustChangePasswordGuard],
    data: { breadcrumb: 'Tableau de bord' },
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/errors/unauthorized.component').then(
        (module) => module.UnauthorizedComponent,
      ),
    title: 'Acces refuse — PDREF',
  },
  {
    path: 'error',
    loadComponent: () =>
      import('./features/errors/error-page.component').then((module) => module.ErrorPageComponent),
    title: 'Erreur — PDREF',
  },
  {
    path: 'introuvable',
    loadComponent: () =>
      import('./features/errors/not-found.component').then((module) => module.NotFoundComponent),
    title: 'Page introuvable - PDREF',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/errors/not-found.component').then((module) => module.NotFoundComponent),
    title: 'Page introuvable �?" PDREF',
  },
];
