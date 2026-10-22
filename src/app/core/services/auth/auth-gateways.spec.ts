import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoAuthGateway } from './demo-auth.gateway';
import { HttpAuthGateway } from './http-auth.gateway';

const profile = {
  id: 'u1',
  login: 'agent',
  displayName: 'Agent',
  roles: ['AGENT_GUDEF'],
  permissions: ['CAN_READ_OWN_PROFILE'],
  mustChangePassword: false,
};

describe('HttpAuthGateway', () => {
  it('appelle login, refresh, me et logout avec le cookie', async () => {
    TestBed.configureTestingModule({
      providers: [HttpAuthGateway, provideHttpClient(), provideHttpClientTesting()],
    });
    const gateway = TestBed.inject(HttpAuthGateway);
    const controller = TestBed.inject(HttpTestingController);

    const loginPromise = firstValueFrom(gateway.login({ login: 'demo', password: 'secret' }));
    const login = controller.expectOne((request) => request.url.endsWith('/api/v1/auth/login'));
    expect(login.request.withCredentials).toBe(true);
    expect(login.request.method).toBe('POST');
    login.flush({
      success: true,
      data: { accessToken: 'a', expiresAt: '2030-01-01T00:00:00Z' },
    });
    await expect(loginPromise).resolves.toMatchObject({ accessToken: 'a' });

    const refreshPromise = firstValueFrom(gateway.refresh());
    const refresh = controller.expectOne((request) => request.url.endsWith('/api/v1/auth/refresh'));
    expect(refresh.request.withCredentials).toBe(true);
    refresh.flush({
      success: true,
      data: { accessToken: 'b', expiresAt: '2030-01-01T00:00:00Z' },
    });
    await refreshPromise;

    const mePromise = firstValueFrom(gateway.me());
    const me = controller.expectOne((request) => request.url.endsWith('/api/v1/me'));
    expect(me.request.withCredentials).toBe(true);
    me.flush({ success: true, data: profile });
    await expect(mePromise).resolves.toEqual(profile);

    const logoutPromise = firstValueFrom(gateway.logout());
    const logout = controller.expectOne((request) => request.url.endsWith('/api/v1/auth/logout'));
    expect(logout.request.withCredentials).toBe(true);
    logout.flush(null);
    await logoutPromise;

    controller.verify();
  });

  it('envoie forgot, reset et change-password avec le cookie', async () => {
    TestBed.configureTestingModule({
      providers: [HttpAuthGateway, provideHttpClient(), provideHttpClientTesting()],
    });
    const gateway = TestBed.inject(HttpAuthGateway);
    const controller = TestBed.inject(HttpTestingController);

    const forgot = firstValueFrom(gateway.forgotPassword('agent'));
    controller
      .expectOne((request) => request.url.endsWith('/api/v1/auth/forgot-password'))
      .flush({ success: true, data: {} });
    await forgot;

    const reset = firstValueFrom(gateway.resetPassword('token', 'New-Password-2026!'));
    controller
      .expectOne((request) => request.url.endsWith('/api/v1/auth/reset-password'))
      .flush({ success: true, data: {} });
    await reset;

    const change = firstValueFrom(
      gateway.changePassword('Old-Password-2026!', 'New-Password-2026!'),
    );
    controller
      .expectOne((request) => request.url.endsWith('/api/v1/me/change-password'))
      .flush({ success: true, data: {} });
    await change;

    controller.verify();
  });
});

describe('DemoAuthGateway', () => {
  it('retourne des jetons de demonstration sans refresh token', async () => {
    const gateway = new DemoAuthGateway();
    const tokens = await firstValueFrom(gateway.login());

    expect(tokens.accessToken).toBe('demo-access-token');
    expect('refreshToken' in tokens).toBe(false);
  });

  it('se deconnecte sans appel reseau', async () => {
    const gateway = new DemoAuthGateway();
    await expect(firstValueFrom(gateway.logout())).resolves.toBeUndefined();
  });
});
