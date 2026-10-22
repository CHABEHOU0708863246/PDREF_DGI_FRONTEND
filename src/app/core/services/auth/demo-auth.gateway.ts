import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { delay, of } from 'rxjs';
import type { AuthSession } from '../../models/auth/auth.model';
import type { AuthGateway } from './auth.gateway';

/**
 * Mode demonstration L2 : aucun appel reseau. Permissions vides : le shell
 * s'affiche mais aucun ecran metier n'est accessible.
 */
@Injectable({ providedIn: 'root' })
export class DemoAuthGateway implements AuthGateway {
  login(): Observable<AuthSession> {
    return of(this.session()).pipe(delay(120));
  }

  refresh(): Observable<AuthSession> {
    return of(this.session()).pipe(delay(120));
  }

  logout(): Observable<void> {
    return of(void 0).pipe(delay(60));
  }

  private session(): AuthSession {
    return {
      accessToken: 'demo-access-token',
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 'demo-agent',
        displayName: 'Agent de demonstration',
        roles: [],
        permissions: [],
        mustChangePassword: false,
      },
    };
  }
}
