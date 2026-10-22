import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoAuthGateway } from './demo-auth.gateway';
import { HttpAuthGateway } from './http-auth.gateway';

describe('HttpAuthGateway', () => {
  it('appelle login, refresh et logout avec le cookie', async () => {
    TestBed.configureTestingModule({
      providers: [HttpAuthGateway, provideHttpClient(), provideHttpClientTesting()],
    });
    const gateway = TestBed.inject(HttpAuthGateway);
    const controller = TestBed.inject(HttpTestingController);

    const loginPromise = firstValueFrom(gateway.login({ login: 'demo', password: 'secret' }));
    const login = controller.expectOne((request) => request.url.endsWith('/api/v1/auth/login'));
    expect(login.request.withCredentials).toBe(true);
    expect(login.request.method).toBe('POST');
    login.flush({ accessToken: 'a', expiresAt: '2030-01-01T00:00:00Z', user: {} });
    await loginPromise;

    const refreshPromise = firstValueFrom(gateway.refresh());
    const refresh = controller.expectOne((request) => request.url.endsWith('/api/v1/auth/refresh'));
    expect(refresh.request.withCredentials).toBe(true);
    refresh.flush({ accessToken: 'b', expiresAt: '2030-01-01T00:00:00Z', user: {} });
    await refreshPromise;

    const logoutPromise = firstValueFrom(gateway.logout());
    const logout = controller.expectOne((request) => request.url.endsWith('/api/v1/auth/logout'));
    expect(logout.request.withCredentials).toBe(true);
    logout.flush(null);
    await logoutPromise;

    controller.verify();
  });
});

describe('DemoAuthGateway', () => {
  it('retourne une session de demonstration sans refresh token', async () => {
    const gateway = new DemoAuthGateway();
    const session = await firstValueFrom(gateway.login());

    expect(session.accessToken).toBe('demo-access-token');
    expect(session.user.permissions).toEqual([]);
    expect('refreshToken' in session).toBe(false);
  });

  it('se deconnecte sans appel reseau', async () => {
    const gateway = new DemoAuthGateway();
    await expect(firstValueFrom(gateway.logout())).resolves.toBeUndefined();
  });
});
