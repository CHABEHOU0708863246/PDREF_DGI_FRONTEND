import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { PermissionsService } from '../services/permissions/permissions.service';

export const accessGuard: CanActivateFn = (route) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }

  const permissions = inject(PermissionsService);
  const router = inject(Router);

  if (!permissions.ready()) {
    return router.createUrlTree(['/unauthorized']);
  }

  const anyPermissions = (route.data['permissions'] as string[] | undefined) ?? [];
  const allPermissions = (route.data['allPermissions'] as string[] | undefined) ?? [];
  const roles = (route.data['roles'] as string[] | undefined) ?? [];

  if (allPermissions.length > 0 && !permissions.hasAllPermissions(...allPermissions)) {
    return router.createUrlTree(['/unauthorized']);
  }

  if (anyPermissions.length > 0 && !permissions.hasAnyPermission(...anyPermissions)) {
    return router.createUrlTree(['/unauthorized']);
  }

  if (roles.length > 0 && !permissions.hasAnyRole(...roles)) {
    return router.createUrlTree(['/unauthorized']);
  }

  return true;
};
