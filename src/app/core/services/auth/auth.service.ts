import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { catchError, finalize, of, shareReplay, tap } from 'rxjs';
import type { AuthSession, LoginCredentials } from '../../models/auth/auth.model';
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
    return this.gateway.login(credentials).pipe(tap((session) => this.applySession(session)));
  }

  refresh(): Observable<AuthSession> {
    return this.gateway.refresh().pipe(tap((session) => this.applySession(session)));
  }

  refreshOnce(): Observable<AuthSession> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.gateway.refresh().pipe(
        tap((session) => this.applySession(session)),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.refreshInFlight;
  }

  applySession(session: AuthSession): void {
    this.sessionState.set(session);
    this.tokenStore.set(session);
    this.permissions.load(session.user);
  }

  clearSession(): void {
    this.sessionState.set(null);
    this.tokenStore.clear();
    this.permissions.clear();
  }

  expireSession(): void {
    this.clearSession();
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
}
