import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { PermissionsService } from '../permissions/permissions.service';
import { TokenStore } from '../token/token.store';
import { AUTH_GATEWAY } from './auth.gateway';
import { AuthService } from './auth.service';

const tokens = {
  accessToken: 'access-1',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};

const user = {
  id: 'u1',
  login: 'demo',
  displayName: 'Demo',
  roles: ['AUDITEUR'],
  permissions: ['CAN_READ_OWN_PROFILE'],
  mustChangePassword: false,
};

function setup(refresh = vi.fn(() => of(tokens))) {
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const gateway = {
    login: vi.fn(() => of(tokens)),
    refresh,
    logout: vi.fn(() => of(void 0)),
    me: vi.fn(() => of(user)),
    forgotPassword: vi.fn(() => of(void 0)),
    resetPassword: vi.fn(() => of(void 0)),
    changePassword: vi.fn(() => of(void 0)),
    startMfaEnrollment: vi.fn(() =>
      of({
        secret: 'SECRET',
        otpAuthUri: 'otpauth://totp/PDREF',
        qrCodeDataUri: 'data:image/png;base64,abc',
      }),
    ),
    confirmMfaEnrollment: vi.fn(() => of({ tokens, recoveryCodes: ['AAAAA-BBBBB'] })),
    verifyMfa: vi.fn(() => of(tokens)),
    regenerateRecoveryCodes: vi.fn(() => of(['CCCCC-DDDDD'])),
  };

  TestBed.configureTestingModule({
    providers: [
      AuthService,
      TokenStore,
      PermissionsService,
      { provide: AUTH_GATEWAY, useValue: gateway },
      { provide: Router, useValue: router },
    ],
  });

  return { service: TestBed.inject(AuthService), gateway, router };
}

describe('AuthService', () => {
  it('charge le profil apres login et applique les permissions', () => {
    const { service, gateway } = setup();
    service.login({ login: 'demo', password: 'secret' }).subscribe();

    expect(gateway.login).toHaveBeenCalledOnce();
    expect(gateway.me).toHaveBeenCalledOnce();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.displayName).toBe('Demo');
    expect(TestBed.inject(PermissionsService).hasPermission('CAN_READ_OWN_PROFILE')).toBe(true);
    expect(TestBed.inject(TokenStore).getAccessToken()).toBe('access-1');
  });

  it('vide la session a la deconnexion', () => {
    const { service, gateway } = setup();
    service.applySession(tokens, user);
    service.logout().subscribe();

    expect(gateway.logout).toHaveBeenCalledOnce();
    expect(service.isAuthenticated()).toBe(false);
    expect(TestBed.inject(TokenStore).getAccessToken()).toBeNull();
  });

  it('redirige vers login quand la session expire', () => {
    const { service, router } = setup();
    service.applySession(tokens, user);
    service.expireSession();

    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { expired: '1' },
    });
  });

  it('ne lance qu un seul refresh pour des appels paralleles', () => {
    const subject = new Subject<typeof tokens>();
    const refresh = vi.fn(() => subject.asObservable());
    const { service } = setup(refresh);
    let first = 0;
    let second = 0;

    service.refreshOnce().subscribe(() => (first += 1));
    service.refreshOnce().subscribe(() => (second += 1));

    expect(refresh).toHaveBeenCalledOnce();
    subject.next(tokens);
    subject.complete();

    expect(first).toBe(1);
    expect(second).toBe(1);
  });

  it('vide la session meme si le logout reseau echoue', () => {
    const { service, gateway } = setup();
    gateway.logout.mockImplementation(() => throwError(() => new Error('reseau')));
    service.applySession(tokens, user);

    service.logout().subscribe();

    expect(service.isAuthenticated()).toBe(false);
    expect(TestBed.inject(TokenStore).getAccessToken()).toBeNull();
  });

  it('remonte l erreur de refresh', () => {
    const refresh = vi.fn(() => throwError(() => new Error('refresh ko')));
    const { service } = setup(refresh);
    let failed = false;

    service.refresh().subscribe({
      next: () => undefined,
      error: () => (failed = true),
    });

    expect(failed).toBe(true);
  });

  it('gere le challenge MFA, l enrolement et les codes de secours', () => {
    const { service, gateway } = setup();
    gateway.login.mockReturnValue(
      of({
        mfaRequired: true,
        enrollmentRequired: false,
        challengeToken: 'challenge',
      }) as never,
    );
    let challenge: unknown;
    service.login({ login: 'demo', password: 'secret' }).subscribe((value) => {
      challenge = value;
    });
    expect(challenge).toMatchObject({ challengeToken: 'challenge' });
    expect(gateway.me).not.toHaveBeenCalled();

    service.startMfaEnrollment('challenge').subscribe();
    expect(gateway.startMfaEnrollment).toHaveBeenCalledWith('challenge');

    let confirmed: { recoveryCodes: string[] } | undefined;
    service.confirmMfaEnrollment('challenge', '123456').subscribe((value) => {
      confirmed = value;
    });
    expect(confirmed?.recoveryCodes).toEqual(['AAAAA-BBBBB']);

    service.verifyMfa('challenge', '123456').subscribe();
    expect(gateway.verifyMfa).toHaveBeenCalledWith('challenge', '123456');

    service.regenerateRecoveryCodes().subscribe();
    expect(gateway.regenerateRecoveryCodes).toHaveBeenCalledOnce();
  });

  it('leve mustChangePassword apres changement', () => {
    const { service } = setup();
    service.applySession(tokens, { ...user, mustChangePassword: true });
    service.markPasswordChanged();

    expect(service.currentUser()?.mustChangePassword).toBe(false);
    expect(TestBed.inject(PermissionsService).mustChangePassword()).toBe(false);
  });
});
