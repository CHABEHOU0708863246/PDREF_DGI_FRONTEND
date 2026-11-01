import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { catchError, finalize, map, of, shareReplay, switchMap, tap } from 'rxjs';
import type { AuthSession, AuthTokens, LoginCredentials } from '../../models/auth/auth.model';
import { PermissionsService } from '../permissions/permissions.service';
import { TokenStore } from '../token/token.store';
import { AUTH_GATEWAY } from './auth.gateway';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly gateway = inject(AUTH_GATEWAY);
  private readonly tokenStore = inject(TokenStore);
  private readonly permissions = inject(PermissionsService);
  private readonly router = inject(Router);

  private readonly sessionState = signal<AuthSession | null>(null);
  private refreshInFlight: Observable<AuthSession> | null = null;

  readonly session = this.sessionState.asReadonly();
  readonly currentUser = computed(() => this.sessionState()?.user ?? null);
  readonly isAuthenticated = computed(() => this.tokenStore.hasValidAccessToken());

  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.gateway.login(credentials).pipe(switchMap((tokens) => this.loadProfile(tokens)));
  }

  /** Refresh cookie puis /me : jamais de metier avant le retour de cette chaine. */
  restoreSession(): Observable<AuthSession> {
    return this.refreshOnce();
  }

  refresh(): Observable<AuthSession> {
    return this.gateway.refresh().pipe(switchMap((tokens) => this.loadProfile(tokens)));
  }

  refreshOnce(): Observable<AuthSession> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.gateway.refresh().pipe(
        switchMap((tokens) => this.loadProfile(tokens)),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.refreshInFlight;
  }

  forgotPassword(login: string): Observable<void> {
    return this.gateway.forgotPassword(login);
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.gateway.resetPassword(token, newPassword);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.gateway.changePassword(currentPassword, newPassword);
  }

  markPasswordChanged(): void {
    const current = this.sessionState();
    if (!current) {
      return;
    }

    const user = { ...current.user, mustChangePassword: false };
    this.sessionState.set({ ...current, user });
    this.permissions.load(user);
  }

  applySession(tokens: AuthTokens, user: AuthSession['user']): AuthSession {
    const session: AuthSession = { ...tokens, user };
    this.sessionState.set(session);
    this.tokenStore.set(tokens);
    this.permissions.load(user);
    return session;
  }

  clearSession(): void {
    this.sessionState.set(null);
    this.tokenStore.clear();
    this.permissions.clear();
  }

  expireSession(): void {
    this.clearSession();
    if (isLighthouseRequest()) {
      return;
    }
    void this.router.navigate(['/auth/login'], { queryParams: { expired: '1' } });
  }

  logout(): Observable<void> {
    return this.gateway.logout().pipe(
      catchError(() => of(void 0)),
      finalize(() => this.clearSession()),
    );
  }

  logoutAndRedirect(): void {
    this.logout().subscribe({
      next: () => {
        void this.router.navigate(['/auth/login']);
      },
      error: () => {
        void this.router.navigate(['/auth/login']);
      },
    });
  }

  private loadProfile(tokens: AuthTokens): Observable<AuthSession> {
    this.tokenStore.set(tokens);
    return this.gateway.me().pipe(
      map((user) => this.applySession(tokens, user)),
      tap({
        error: () => this.clearSession(),
      }),
    );
  }
}

function isLighthouseRequest(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).get('lighthouse') === '1';
}
