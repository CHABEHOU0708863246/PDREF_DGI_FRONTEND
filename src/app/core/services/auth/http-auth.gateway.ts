import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  AuthTokens,
  ChangePasswordRequest,
  CurrentUser,
  LoginCredentials,
  LoginResult,
  MfaEnrollmentConfirmed,
  MfaEnrollmentMaterial,
} from '../../models/auth/auth.model';
import type { AuthGateway } from './auth.gateway';

/**
 * Cookie HttpOnly pour le refresh, aucun refresh token dans le JSON.
 * Seul l'access token est conserve en memoire par TokenStore.
 */
@Injectable({ providedIn: 'root' })
export class HttpAuthGateway implements AuthGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1`;

  login(credentials: LoginCredentials): Observable<LoginResult> {
    return this.http
      .post<ApiResponse<LoginResult>>(`${this.base}/auth/login`, credentials, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  startMfaEnrollment(challengeToken: string): Observable<MfaEnrollmentMaterial> {
    return this.http
      .post<ApiResponse<MfaEnrollmentMaterial>>(
        `${this.base}/auth/mfa/enrollment/start`,
        { challengeToken },
        { withCredentials: true },
      )
      .pipe(map((response) => response.data));
  }

  confirmMfaEnrollment(challengeToken: string, code: string): Observable<MfaEnrollmentConfirmed> {
    return this.http
      .post<ApiResponse<MfaEnrollmentConfirmed>>(
        `${this.base}/auth/mfa/enrollment/confirm`,
        { challengeToken, code },
        { withCredentials: true },
      )
      .pipe(map((response) => response.data));
  }

  verifyMfa(challengeToken: string, code: string): Observable<AuthTokens> {
    return this.http
      .post<ApiResponse<AuthTokens>>(
        `${this.base}/auth/mfa/verify`,
        { challengeToken, code },
        { withCredentials: true },
      )
      .pipe(map((response) => response.data));
  }

  regenerateRecoveryCodes(): Observable<string[]> {
    return this.http
      .post<ApiResponse<{ recoveryCodes: string[] }>>(
        `${this.base}/me/mfa/recovery-codes`,
        {},
        { withCredentials: true },
      )
      .pipe(map((response) => response.data.recoveryCodes));
  }

  refresh(): Observable<AuthTokens> {
    return this.http
      .post<ApiResponse<AuthTokens>>(`${this.base}/auth/refresh`, null, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/logout`, null, {
      withCredentials: true,
    });
  }

  me(): Observable<CurrentUser> {
    return this.http
      .get<ApiResponse<CurrentUser>>(`${this.base}/me`, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  forgotPassword(login: string): Observable<void> {
    return this.http
      .post<ApiResponse<object>>(
        `${this.base}/auth/forgot-password`,
        { login },
        { withCredentials: true },
      )
      .pipe(map(() => void 0));
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http
      .post<ApiResponse<object>>(
        `${this.base}/auth/reset-password`,
        { token, newPassword },
        { withCredentials: true },
      )
      .pipe(map(() => void 0));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<ApiResponse<object>>(
        `${this.base}/me/change-password`,
        { currentPassword, newPassword } satisfies ChangePasswordRequest,
        { withCredentials: true },
      )
      .pipe(map(() => void 0));
  }
}
