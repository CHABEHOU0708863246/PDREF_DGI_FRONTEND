import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { HttpAuditGateway } from '../../core/services/audit/http-audit.gateway';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { AuditListComponent } from './audit-list.component';

const page = {
  items: [
    {
      id: 'a1',
      eventCode: 'AUTH.LOGIN_SUCCESS',
      phase: 'OUTCOME' as const,
      result: 'SUCCESS',
      occurredAt: '2026-10-23T10:00:00Z',
      actorUserId: 'u1',
      actorRoles: ['AGENT_GUDEF'],
      targetType: 'USER',
      targetId: 'u1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      traceId: 'trace-1',
      channel: 'HTTP',
      ipTruncated: '192.168.1.0',
      reason: null,
      changes: null,
      entryHash: 'hash',
    },
  ],
  nextCursor: 'next',
  pageSize: 50,
};

function setup(auditRead = true, auditExport = false) {
  const gateway = {
    query: vi.fn(() => of(page)),
    export: vi.fn(() => of(new Blob(['id'], { type: 'text/csv' }))),
  };
  const permissions = new PermissionsService();
  permissions.load({
    id: 'u',
    login: 'u',
    displayName: 'u',
    roles: [],
    permissions: [auditRead ? 'Audit_Read' : 'X', auditExport ? 'Audit_Export' : 'X'],
    mustChangePassword: false,
  });

  TestBed.configureTestingModule({
    imports: [AuditListComponent],
    providers: [
      { provide: HttpAuditGateway, useValue: gateway },
      { provide: PermissionsService, useValue: permissions },
    ],
  });

  return { fixture: TestBed.createComponent(AuditListComponent), gateway };
}

describe('AuditListComponent', () => {
  it('charge une page et affiche les evenements', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();

    expect(gateway.query).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.items()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('AUTH.LOGIN_SUCCESS');
    expect(fixture.nativeElement.textContent).toContain('Charger la suite');
  });

  it('applique les filtres et charge la suite avec le curseur', () => {
    const { fixture, gateway } = setup();
    fixture.componentInstance.filters.patchValue({ eventCode: 'AUTH.LOGIN_SUCCESS' });
    fixture.componentInstance.apply();
    fixture.componentInstance.loadMore();

    expect(gateway.query).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ eventCode: 'AUTH.LOGIN_SUCCESS' }),
    );
    expect(gateway.query).toHaveBeenNthCalledWith(3, expect.objectContaining({ cursor: 'next' }));
  });

  it('masque l export sans Audit_Export', () => {
    const { fixture } = setup(true, false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Exporter CSV');
  });

  it('exporte en lecture seule avec Audit_Export', () => {
    const { fixture, gateway } = setup(true, true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Exporter CSV');
    fixture.componentInstance.export('csv');
    expect(gateway.export).toHaveBeenCalledWith(expect.anything(), 'csv');
  });
});
