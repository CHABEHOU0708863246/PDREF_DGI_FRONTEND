import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NotificationService } from './notification.service';

function setup(platform: 'browser' | 'server' = 'browser') {
  TestBed.configureTestingModule({
    providers: [NotificationService, { provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(NotificationService);
}

describe('NotificationService', () => {
  it('affiche code, detail, trace et reference', () => {
    const service = setup();
    service.showProblem({
      type: 'urn:pdref:error:RG-18',
      title: 'Trois avis requis',
      status: 422,
      detail: 'Les avis sont incomplets.',
      code: 'RG-18',
      traceId: 'trace-1',
      reference: 'ERR-1',
      errors: [],
    });

    const toast = service.toasts()[0];
    expect(toast?.code).toBe('RG-18');
    expect(toast?.message).toBe('Les avis sont incomplets.');
    expect(toast?.traceId).toBe('trace-1');
    expect(toast?.reference).toBe('ERR-1');
    expect(toast?.sticky).toBe(true);
  });

  it('affiche un message de repli si le detail est technique', () => {
    const service = setup();
    service.showProblem({
      type: 'urn:pdref:error:INTERNAL_ERROR',
      title: 'Erreur technique',
      status: 500,
      detail: 'NullReferenceException at Secret.Service',
      code: 'INTERNAL_ERROR',
      traceId: 'trace-2',
    });

    expect(service.toasts()[0]?.message).toContain('Reessayez');
  });

  it('gere succes, info, avertissement, erreur, fermeture et purge', () => {
    const service = setup();
    service.success('OK', 'Fait');
    service.info('Info', 'Information');
    service.warning('Attention', 'Verifier');
    service.error('Erreur', 'Echec');
    expect(service.toasts()).toHaveLength(4);
    expect(service.toasts()[3]?.sticky).toBe(true);

    const id = service.toasts()[0]?.id ?? '';
    service.dismiss(id);
    expect(service.toasts()).toHaveLength(3);

    service.clear();
    expect(service.toasts()).toHaveLength(0);
  });

  it('fournit un message de repli par code', () => {
    const service = setup();
    for (const code of [
      'NETWORK_ERROR',
      'UNAUTHENTICATED',
      'SESSION_EXPIRED',
      'PERMISSION_DENIED',
      'RATE_LIMITED',
      'SERVICE_UNAVAILABLE',
      'INCONNU',
    ]) {
      service.showProblem({
        type: `urn:pdref:error:${code}`,
        title: code,
        status: 400,
        code,
        traceId: 'trace',
      });
    }

    expect(service.toasts()).toHaveLength(7);
    expect(service.toasts()[0]?.message).toContain('connexion');
    expect(service.toasts()[2]?.message).toContain('session');
    expect(service.toasts()[6]?.message).toContain('support');
  });

  it('ne pousse rien cote serveur', () => {
    const service = setup('server');
    service.success('OK', 'Fait');
    expect(service.toasts()).toHaveLength(0);
  });
});
