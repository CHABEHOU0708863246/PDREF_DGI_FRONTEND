import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { PermissionsService } from '../services/permissions/permissions.service';
import { accessGuard } from './access.guard';

function setup(ready = true) {
  const createUrlTree = vi.fn(() => ({ redirect: true }));
  const permissions = new PermissionsService();
  if (ready) {
    permissions.load({
      id: 'u',
      login: 'u',
      displayName: 'u',
      roles: ['AUDITEUR'],
      permissions: ['Demandes_Read', 'Rapports_Read'],
      mustChangePassword: false,
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

const state = {} as RouterStateSnapshot;

describe('accessGuard', () => {
  it('laisse passer si une permission requise est presente', async () => {
    setup();
    const route = { data: { permissions: ['Demandes_Read'] } } as unknown as ActivatedRouteSnapshot;
    expect(TestBed.runInInjectionContext(() => accessGuard(route, state))).toBe(true);
  });

  it('refuse si une permission manque', async () => {
    const { createUrlTree } = setup();
    const route = { data: { permissions: ['Users_Manage'] } } as unknown as ActivatedRouteSnapshot;
    await TestBed.runInInjectionContext(() => accessGuard(route, state));
    expect(createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
  });

  it('respecte allPermissions et roles', async () => {
    setup();
    const all = {
      data: { allPermissions: ['Demandes_Read', 'Rapports_Read'] },
    } as unknown as ActivatedRouteSnapshot;
    const role = { data: { roles: ['AUDITEUR'] } } as unknown as ActivatedRouteSnapshot;

    expect(TestBed.runInInjectionContext(() => accessGuard(all, state))).toBe(true);
    expect(TestBed.runInInjectionContext(() => accessGuard(role, state))).toBe(true);
  });

  it('refuse tant que les permissions ne sont pas pretes', async () => {
    const { createUrlTree } = setup(false);
    const route = { data: {} } as ActivatedRouteSnapshot;
    await TestBed.runInInjectionContext(() => accessGuard(route, state));
    expect(createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
  });
});
