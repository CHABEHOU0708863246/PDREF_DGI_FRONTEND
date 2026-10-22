import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { sanitizeReturnUrl } from '../utils/url';

export const authGuard: CanActivateFn = (_route, state) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: sanitizeReturnUrl(state.url) },
  });
};

export const loginGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
