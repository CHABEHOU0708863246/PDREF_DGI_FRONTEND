import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { delay, of } from 'rxjs';
import type { AuthTokens, CurrentUser } from '../../models/auth/auth.model';
import type { AuthGateway } from './auth.gateway';

/**
 * Mode demonstration : aucun appel reseau, permissions vides. Le mode reel
 * (`http`) est utilise en production ; ce gateway reste disponible pour les tests.
 */
@Injectable({ providedIn: 'root' })
export class DemoAuthGateway implements AuthGateway {
  login(): Observable<AuthTokens> {
    return of(this.tokens()).pipe(delay(120));
  }

  refresh(): Observable<AuthTokens> {
    return of(this.tokens()).pipe(delay(120));
  }

  logout(): Observable<void> {
    return of(void 0).pipe(delay(60));
  }

  me(): Observable<CurrentUser> {
    return of(this.user()).pipe(delay(80));
  }

  forgotPassword(): Observable<void> {
    return of(void 0).pipe(delay(80));
  }

  resetPassword(): Observable<void> {
    return of(void 0).pipe(delay(80));
  }

  changePassword(): Observable<void> {
    return of(void 0).pipe(delay(80));
  }

  private tokens(): AuthTokens {
    return {
      accessToken: 'demo-access-token',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  private user(): CurrentUser {
    return {
      id: 'demo-agent',
      login: 'demo',
      displayName: 'Agent de demonstration',
      roles: [],
      permissions: [],
      mustChangePassword: false,
    };
  }
}
