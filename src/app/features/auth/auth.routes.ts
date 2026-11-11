import type { Routes } from '@angular/router';
import { authGuard, loginGuard } from '../../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((module) => module.LoginComponent),
    canActivate: [loginGuard],
    title: 'Connexion - PDREF',
  },
  {
    path: 'mfa',
    loadComponent: () =>
      import('./mfa/mfa-verify.component').then((module) => module.MfaVerifyComponent),
    title: 'Code de verification - PDREF',
  },
  {
    path: 'mfa/enrollment',
    loadComponent: () =>
      import('./mfa/mfa-enroll.component').then((module) => module.MfaEnrollComponent),
    title: 'Double authentification - PDREF',
  },
  {
    path: 'mfa/recovery-codes',
    loadComponent: () =>
      import('./mfa/mfa-recovery-codes.component').then(
        (module) => module.MfaRecoveryCodesComponent,
      ),
    canActivate: [authGuard],
    title: 'Codes de secours - PDREF',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.component').then(
        (module) => module.ForgotPasswordComponent,
      ),
    title: 'Mot de passe oublie - PDREF',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password.component').then(
        (module) => module.ResetPasswordComponent,
      ),
    title: 'Reinitialisation - PDREF',
  },
  {
    path: 'my-profile',
    loadComponent: () =>
      import('./my-profile/my-profile.component').then((module) => module.MyProfileComponent),
    canActivate: [authGuard],
    title: 'Mon profil - PDREF',
    data: { breadcrumb: 'Mon profil' },
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
];
