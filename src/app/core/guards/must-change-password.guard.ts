import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { PermissionsService } from '../services/permissions/permissions.service';

/**
 * Force le changement du mot de passe initial avant tout ecran metier.
 * Le profil reste accessible pour effectuer l'action.
 */
export const mustChangePasswordGuard: CanActivateFn = (_route, state) => {
  const permissions = inject(PermissionsService);
  const router = inject(Router);

  if (!permissions.ready()) {
    return true;
  }

  if (permissions.mustChangePassword() && !state.url.startsWith('/auth/my-profile')) {
    return router.createUrlTree(['/auth/my-profile'], { queryParams: { mustChange: '1' } });
  }

  return true;
};
