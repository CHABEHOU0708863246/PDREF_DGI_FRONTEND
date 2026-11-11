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
    detail: vi.fn(() => of(page.items[0])),
    chronology: vi.fn(() => of(page.items)),
    integrity: vi.fn(() => of({ total: 1, valid: 1, invalid: 0, checkedAt: '2026-11-11' })),
    requestExport: vi.fn(() =>
      of({
        id: 'e1',
        format: 'CSV',
        status: 'PRET',
        expiresAt: '2026-12-11',
        sizeBytes: 10,
      }),
    ),
    getExport: vi.fn(() =>
      of({
        id: 'e1',
        format: 'CSV',
        status: 'PRET',
        expiresAt: '2026-12-11',
        fileName: 'audit.csv',
        sizeBytes: 10,
      }),
    ),
    downloadExport: vi.fn(() => of(new Blob(['id'], { type: 'text/csv' }))),
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

  it('exporte en arriere-plan avec Audit_Export', () => {
    const { fixture, gateway } = setup(true, true);
    fixture.detectChanges();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:audit');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    expect(fixture.nativeElement.textContent).toContain('Exporter CSV');
    fixture.componentInstance.export('CSV');
    expect(gateway.requestExport).toHaveBeenCalledWith(expect.anything(), 'CSV');
    expect(gateway.downloadExport).toHaveBeenCalledWith('e1');
  });

  it('charge le detail, la chronologie et verifie l integrite', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.openDetail(page.items[0]);
    fixture.componentInstance.filters.patchValue({ dossierNumber: '2026-0001' });
    fixture.componentInstance.loadChronology();
    fixture.componentInstance.verifyIntegrity();

    expect(gateway.detail).toHaveBeenCalledWith('a1');
    expect(gateway.chronology).toHaveBeenCalledWith('2026-0001');
    expect(gateway.integrity).toHaveBeenCalled();
    expect(fixture.componentInstance.detail()).not.toBeNull();
    expect(fixture.componentInstance.chronology()).toHaveLength(1);
    expect(fixture.componentInstance.integrity()?.invalid).toBe(0);
  });
});
