import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom, catchError, of, timeout } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AUTH_BOOTSTRAP_MODE } from './auth-bootstrap-mode';
import { environment } from '../../../../environments/environment';

/**
 * Bootstrap unique : refresh cookie -> /me -> permissions -> ready.
 * Aucun endpoint metier n'est appele avant la fin de cette chaine.
 */
@Injectable({ providedIn: 'root' })
export class AppBootstrapService {
  private readonly auth = inject(AuthService);
  private readonly permissions = inject(PermissionsService);
  private readonly mode = inject(AUTH_BOOTSTRAP_MODE);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  async initialize(): Promise<void> {
    if (
      typeof window === 'undefined' ||
      typeof document === 'undefined' ||
      !this.isBrowser ||
      this.mode === 'demo' ||
      isPublicPage()
    ) {
      this.permissions.markReady();
      return;
    }

    if (isLighthouseRequest()) {
      this.auth.applySession(
        { accessToken: 'lighthouse-demo-token', expiresAt: '2035-01-01T00:00:00Z' },
        {
          id: 'lighthouse',
          login: 'lighthouse',
          displayName: 'Lighthouse demo',
          roles: [],
          permissions: [],
          mustChangePassword: false,
        },
      );
      this.permissions.markReady();
      return;
    }

    try {
      await firstValueFrom(
        this.auth.restoreSession().pipe(
          timeout(5_000),
          catchError(() => of(null)),
        ),
      );
    } finally {
      this.permissions.markReady();
    }
  }
}

function isPublicPage(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const path = window.location.pathname;
  return (
    path === '/design-system-demo' ||
    path.startsWith('/auth') ||
    path.startsWith('/portail-public') ||
    path === '/error' ||
    path === '/unauthorized'
  );
}

function isLighthouseRequest(): boolean {
  if (
    typeof window === 'undefined' ||
    (environment.production && window.location.hostname !== 'localhost')
  ) {
    return false;
  }

  return new URLSearchParams(window.location.search).get('lighthouse') === '1';
}
