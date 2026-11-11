import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  AuthTokens,
  CurrentUser,
  LoginCredentials,
  LoginResult,
  MfaEnrollmentConfirmed,
  MfaEnrollmentMaterial,
} from '../../models/auth/auth.model';

export interface AuthGateway {
  login(credentials: LoginCredentials): Observable<LoginResult>;

  refresh(): Observable<AuthTokens>;

  startMfaEnrollment(challengeToken: string): Observable<MfaEnrollmentMaterial>;

  confirmMfaEnrollment(challengeToken: string, code: string): Observable<MfaEnrollmentConfirmed>;

  verifyMfa(challengeToken: string, code: string): Observable<AuthTokens>;

  regenerateRecoveryCodes(): Observable<string[]>;

  logout(): Observable<void>;

  me(): Observable<CurrentUser>;

  forgotPassword(login: string): Observable<void>;

  resetPassword(token: string, newPassword: string): Observable<void>;

  changePassword(currentPassword: string, newPassword: string): Observable<void>;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY');
