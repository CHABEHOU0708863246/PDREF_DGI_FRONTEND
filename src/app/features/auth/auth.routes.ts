import type { Routes } from '@angular/router';
import { loginGuard } from '../../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth-placeholder.component').then((module) => module.AuthPlaceholderComponent),
    canActivate: [loginGuard],
    title: 'Connexion — PDREF',
    data: { mode: 'Connexion' },
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth-placeholder.component').then((module) => module.AuthPlaceholderComponent),
    title: 'Mot de passe oublie — PDREF',
    data: { mode: 'Mot de passe oublie' },
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./auth-placeholder.component').then((module) => module.AuthPlaceholderComponent),
    title: 'Reinitialisation — PDREF',
    data: { mode: 'Reinitialisation du mot de passe' },
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
];
