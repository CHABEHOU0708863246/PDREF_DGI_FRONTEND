import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { EmailAdminGateway } from '../../core/services/admin/email-admin.gateway';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { EmailAdminPageComponent } from './email-admin-page.component';

const page = {
  items: [
    {
      id: 'o1',
      eventType: 'INVITATION_COMPTE',
      aggregateId: 'u1',
      audience: 'INTERNE',
      recipientMasked: 'a***@test.ci',
      status: 'ECHEC_FINAL',
      attempts: 3,
      lastErrorCode: 'EMAIL_FAILED',
      emailStatus: 'ECHEC',
      emailErrorCode: 'EMAIL_FAILED',
      emailAttempts: 3,
      canRetry: true,
      createdAt: '2026-11-13T08:00:00Z',
      completedAt: '2026-11-13T08:01:00Z',
    },
  ],
  page: 1,
  pageSize: 25,
  totalCount: 1,
};

function setup(manage = true) {
  TestBed.resetTestingModule();
  const gateway = {
    list: vi.fn(() => of(page)),
    retry: vi.fn(() => of(void 0)),
    sendTest: vi.fn(() =>
      of({ success: true, errorCode: null, message: 'E-mail de test envoyé.' }),
    ),
  };
  const permissions = new PermissionsService();
  permissions.load({
    id: 'u',
    login: 'u',
    displayName: 'u',
    roles: ['ADMINISTRATEUR_DSI'],
    permissions: manage ? ['Parametres_Read', 'Parametres_Manage'] : ['Parametres_Read'],
    mustChangePassword: false,
  });

  TestBed.configureTestingModule({
    imports: [EmailAdminPageComponent],
    providers: [
      { provide: EmailAdminGateway, useValue: gateway },
      { provide: PermissionsService, useValue: permissions },
    ],
  });

  return { fixture: TestBed.createComponent(EmailAdminPageComponent), gateway };
}

describe('EmailAdminPageComponent', () => {
  it('liste les e-mails avec destinataire masque et erreur', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();

    expect(gateway.list).toHaveBeenCalledWith(null, 1, 25);
    expect(fixture.nativeElement.textContent).toContain('a***@test.ci');
    expect(fixture.nativeElement.textContent).toContain('Echec final');
    expect(fixture.nativeElement.textContent).toContain('EMAIL_FAILED');
  });

  it('renvoie un e-mail en echec puis recharge', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.retry(page.items[0]);

    expect(gateway.retry).toHaveBeenCalledWith('o1');
    expect(gateway.list).toHaveBeenCalledTimes(2);
  });

  it('envoie un e-mail de test et affiche le resultat', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.testForm.patchValue({ to: 'test@example.test' });
    fixture.componentInstance.sendTest();

    expect(gateway.sendTest).toHaveBeenCalledWith('test@example.test');
    expect(fixture.componentInstance.testResult()?.success).toBe(true);
  });

  it('masque les actions sans permission Manage', () => {
    const { fixture } = setup(false);
    fixture.detectChanges();

    expect(fixture.componentInstance.canManage()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Envoyer le test');
  });

  it('affiche une erreur de chargement', () => {
    TestBed.resetTestingModule();
    const gateway = {
      list: vi.fn(() => throwError(() => new Error('boom'))),
      retry: vi.fn(),
      sendTest: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [EmailAdminPageComponent],
      providers: [{ provide: EmailAdminGateway, useValue: gateway }],
    });
    const fixture = TestBed.createComponent(EmailAdminPageComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.problem()).not.toBeNull();
    expect(fixture.componentInstance.loading()).toBe(false);
  });
});
