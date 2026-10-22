import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { PermissionsService } from '../services/permissions/permissions.service';
import { mustChangePasswordGuard } from './must-change-password.guard';

function setup(mustChange: boolean, ready = true) {
  const createUrlTree = vi.fn((commands: unknown, extras: unknown) => ({ commands, extras }));
  const permissions = new PermissionsService();
  if (ready) {
    permissions.load({
      id: 'u',
      login: 'u',
      displayName: 'u',
      roles: [],
      permissions: [],
      mustChangePassword: mustChange,
    });
  }

  TestBed.configureTestingModule({
    providers: [
      { provide: PermissionsService, useValue: permissions },
      { provide: Router, useValue: { createUrlTree } },
    ],
  });

  return { createUrlTree };
}

const route = {} as ActivatedRouteSnapshot;

describe('mustChangePasswordGuard', () => {
  it('bloque un ecran metier si le mot de passe doit etre change', () => {
    const { createUrlTree } = setup(true);
    const state = { url: '/dashboard' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => mustChangePasswordGuard(route, state));

    expect(result).not.toBe(true);
    expect(createUrlTree).toHaveBeenCalledWith(['/auth/my-profile'], {
      queryParams: { mustChange: '1' },
    });
  });

  it('laisse passer le profil lorsque le changement est requis', () => {
    setup(true);
    expect(
      TestBed.runInInjectionContext(() =>
        mustChangePasswordGuard(route, { url: '/auth/my-profile' } as RouterStateSnapshot),
      ),
    ).toBe(true);
  });

  it('laisse passer une session normale', () => {
    setup(false);
    expect(
      TestBed.runInInjectionContext(() =>
        mustChangePasswordGuard(route, { url: '/dashboard' } as RouterStateSnapshot),
      ),
    ).toBe(true);
  });
  it('ne bloque pas avant que les permissions soient pretes', () => {
    setup(false, false);
    const result = TestBed.runInInjectionContext(() =>
      mustChangePasswordGuard(route, { url: '/dashboard' } as RouterStateSnapshot),
    );
    expect(result).toBe(true);
  });
});
