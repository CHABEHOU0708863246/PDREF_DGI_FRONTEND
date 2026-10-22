import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AppBootstrapService } from './app-bootstrap.service';
import { AUTH_BOOTSTRAP_MODE } from './auth-bootstrap-mode';

const session = {
  accessToken: 'a',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  user: {
    id: 'u',
    login: 'u',
    displayName: 'u',
    roles: [],
    permissions: [],
    mustChangePassword: false,
  },
};

function setup(
  restore: () => unknown,
  platform: 'browser' | 'server' = 'browser',
  mode: 'http' | 'demo' = 'http',
) {
  const auth = { restoreSession: vi.fn(restore) };
  const permissions = { markReady: vi.fn() };

  TestBed.configureTestingModule({
    providers: [
      AppBootstrapService,
      { provide: AuthService, useValue: auth },
      { provide: PermissionsService, useValue: permissions },
      { provide: PLATFORM_ID, useValue: platform },
      { provide: AUTH_BOOTSTRAP_MODE, useValue: mode },
    ],
  });

  return { service: TestBed.inject(AppBootstrapService), auth, permissions };
}

describe('AppBootstrapService', () => {
  it('refresh puis me puis permissions pretes', async () => {
    const { service, auth, permissions } = setup(() => of(session));
    await service.initialize();

    expect(auth.restoreSession).toHaveBeenCalledOnce();
    expect(permissions.markReady).toHaveBeenCalledOnce();
  });

  it('reste silencieux si le refresh echoue', async () => {
    const { service, permissions } = setup(() => throwError(() => new Error('no session')));
    await service.initialize();
    expect(permissions.markReady).toHaveBeenCalledOnce();
  });

  it('ne fait aucun appel cote serveur', async () => {
    const { service, auth, permissions } = setup(() => of(session), 'server');
    await service.initialize();
    expect(auth.restoreSession).not.toHaveBeenCalled();
    expect(permissions.markReady).toHaveBeenCalledOnce();
  });

  it('ne fait aucun appel en mode demo', async () => {
    const { service, auth, permissions } = setup(() => of(session), 'browser', 'demo');
    await service.initialize();
    expect(auth.restoreSession).not.toHaveBeenCalled();
    expect(permissions.markReady).toHaveBeenCalledOnce();
  });
});
