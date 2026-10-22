import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AuthTokens, CurrentUser, LoginCredentials } from '../../models/auth/auth.model';

export interface AuthGateway {
  login(credentials: LoginCredentials): Observable<AuthTokens>;

  refresh(): Observable<AuthTokens>;

  logout(): Observable<void>;

  me(): Observable<CurrentUser>;

  forgotPassword(login: string): Observable<void>;

  resetPassword(token: string, newPassword: string): Observable<void>;

  changePassword(currentPassword: string, newPassword: string): Observable<void>;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY');
