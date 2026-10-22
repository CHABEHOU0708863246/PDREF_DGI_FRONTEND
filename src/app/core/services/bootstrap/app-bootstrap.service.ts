import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom, catchError, of, timeout } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AUTH_BOOTSTRAP_MODE } from './auth-bootstrap-mode';

/**
 * Bootstrap unique : charge la session (cookie HttpOnly) et les permissions
 * AVANT toute navigation ou appel metier. En mode demo, aucun appel reseau.
 */
@Injectable({ providedIn: 'root' })
export class AppBootstrapService {
  private readonly auth = inject(AuthService);
  private readonly permissions = inject(PermissionsService);
  private readonly mode = inject(AUTH_BOOTSTRAP_MODE);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  async initialize(): Promise<void> {
    if (!this.isBrowser || this.mode === 'demo') {
      this.permissions.markReady();
      return;
    }

    try {
      const session = await firstValueFrom(
        this.auth.refresh().pipe(
          timeout(5_000),
          catchError(() => of(null)),
        ),
      );

      if (session) {
        this.auth.applySession(session);
      }
    } finally {
      this.permissions.markReady();
    }
  }
}
