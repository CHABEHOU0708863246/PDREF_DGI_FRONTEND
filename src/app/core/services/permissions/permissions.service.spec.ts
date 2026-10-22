import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  it('charge les permissions et les roles', () => {
    TestBed.configureTestingModule({ providers: [PermissionsService] });
    const service = TestBed.inject(PermissionsService);
    service.load({
      id: 'u1',
      displayName: 'Demo',
      roles: ['AUDITEUR'],
      permissions: ['Demandes_Read', 'Rapports_Read'],
      mustChangePassword: true,
    });

    expect(service.ready()).toBe(true);
    expect(service.mustChangePassword()).toBe(true);
    expect(service.hasPermission('Demandes_Read')).toBe(true);
    expect(service.hasAnyPermission('X', 'Rapports_Read')).toBe(true);
    expect(service.hasAllPermissions('Demandes_Read', 'Rapports_Read')).toBe(true);
    expect(service.hasRole('AUDITEUR')).toBe(true);
    expect(service.hasAnyRole('ADMIN', 'AUDITEUR')).toBe(true);
  });

  it('refuse par defaut et se vide', () => {
    TestBed.configureTestingModule({ providers: [PermissionsService] });
    const service = TestBed.inject(PermissionsService);
    expect(service.ready()).toBe(false);
    expect(service.hasPermission('X')).toBe(false);

    service.load({ id: 'u', displayName: 'u', roles: ['R'], permissions: ['P'] });
    service.clear();
    expect(service.ready()).toBe(false);
    expect(service.hasPermission('P')).toBe(false);
  });

  it('peut etre marque pret sans session', () => {
    TestBed.configureTestingModule({ providers: [PermissionsService] });
    const service = TestBed.inject(PermissionsService);
    service.markReady();
    expect(service.ready()).toBe(true);
  });
});
