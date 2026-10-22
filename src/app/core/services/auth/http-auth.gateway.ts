import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { AuthSession, LoginCredentials } from '../../models/auth/auth.model';
import type { AuthGateway } from './auth.gateway';

/**
 * Contrat L3 : login/refresh/logout avec cookie HttpOnly.
 * Aucun refresh token n'est lu ni stocke par le front.
 */
@Injectable({ providedIn: 'root' })
export class HttpAuthGateway implements AuthGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/auth`;

  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.base}/login`, credentials, {
      withCredentials: true,
    });
  }

  refresh(): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.base}/refresh`, null, {
      withCredentials: true,
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, null, {
      withCredentials: true,
    });
  }
}
