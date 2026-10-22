import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AUTH_GATEWAY } from '../services/auth/auth.gateway';
import { AuthService } from '../services/auth/auth.service';
import { CorrelationService } from '../services/correlation/correlation.service';
import { PermissionsService } from '../services/permissions/permissions.service';
import { TokenStore } from '../services/token/token.store';
import { authInterceptor } from './auth.interceptor';

const refreshed = {
  accessToken: 'new-token',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  user: { id: 'u', displayName: 'u', roles: [], permissions: [] },
};

function setup(refresh = vi.fn(() => of(refreshed))) {
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const gateway = {
    login: vi.fn(),
    refresh,
    logout: vi.fn(() => of(void 0)),
  };

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      AuthService,
      TokenStore,
      PermissionsService,
      CorrelationService,
      { provide: AUTH_GATEWAY, useValue: gateway },
      { provide: Router, useValue: router },
    ],
  });

  return {
    http: TestBed.inject(HttpClient),
    controller: TestBed.inject(HttpTestingController),
    gateway,
    router,
  };
}

describe('authInterceptor', () => {
  it('ajoute le Bearer sur une route protegee', () => {
    const { http, controller } = setup();
    TestBed.inject(AuthService).applySession(refreshed);

    http.get('/api/v1/demandes').subscribe();
    const request = controller.expectOne('/api/v1/demandes');
    expect(request.request.headers.get('Authorization')).toBe('Bearer new-token');
    request.flush({});
  });

  it('sur 401, refresh une fois puis rejoue avec le nouveau token', () => {
    const { http, controller, gateway } = setup();
    http.get('/api/v1/demandes').subscribe();

    controller.expectOne('/api/v1/demandes').flush(
      {},
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    const retry = controller.expectOne('/api/v1/demandes');
    expect(gateway.refresh).toHaveBeenCalledOnce();
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({});
  });

  it('sur echec de refresh, vide la session et ne boucle pas', () => {
    const refresh = vi.fn(() => throwError(() => new Error('refresh ko')));
    const { http, controller, router } = setup(refresh);
    let failed = false;

    http.get('/api/v1/demandes').subscribe({ error: () => (failed = true) });
    controller.expectOne('/api/v1/demandes').flush(
      {},
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    expect(failed).toBe(true);
    expect(router.navigate).toHaveBeenCalled();
    controller.verify();
  });

  it('ne refresh jamais une route auth publique', () => {
    const { http, controller, gateway } = setup();
    http.post('/api/v1/auth/login', {}).subscribe({ error: () => undefined });
    controller.expectOne('/api/v1/auth/login').flush(
      {},
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    expect(gateway.refresh).not.toHaveBeenCalled();
    controller.verify();
  });
});
