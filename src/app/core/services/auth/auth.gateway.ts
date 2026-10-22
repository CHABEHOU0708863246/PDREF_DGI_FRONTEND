import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AuthSession, LoginCredentials } from '../../models/auth/auth.model';

export interface AuthGateway {
  login(credentials: LoginCredentials): Observable<AuthSession>;
  refresh(): Observable<AuthSession>;
  logout(): Observable<void>;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY');
