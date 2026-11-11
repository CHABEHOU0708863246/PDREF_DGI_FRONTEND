import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { HttpAuditGateway } from './http-audit.gateway';

describe('HttpAuditGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(HttpAuditGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('interroge, detaille et charge la chronologie', () => {
    const { gateway, http } = setup();
    gateway
      .query({ eventCode: 'AUTH.LOGIN_SUCCESS', dossierNumber: '2026-0001', limit: 20 })
      .subscribe();
    const query = http.expectOne((request) => request.url.endsWith('/audit/events'));
    expect(query.request.params.get('eventCode')).toBe('AUTH.LOGIN_SUCCESS');
    expect(query.request.params.get('dossierNumber')).toBe('2026-0001');
    query.flush({ data: { items: [], nextCursor: null, pageSize: 20 } });

    gateway.detail('a1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/audit/events/a1'))
      .flush({ data: { id: 'a1' } });

    gateway.chronology('2026-0001').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/audit/dossiers/2026-0001/chronologie'))
      .flush({ data: [] });

    http.verify();
  });

  it('verifie l integrite et gere les exports en arriere-plan', () => {
    const { gateway, http } = setup();
    gateway.integrity({ from: '2026-01-01T00:00:00Z' }).subscribe();
    http
      .expectOne((request) => request.url.endsWith('/audit/integrite'))
      .flush({ data: { total: 1, valid: 1, invalid: 0, checkedAt: '2026-11-11' } });

    gateway.requestExport({ result: 'SUCCESS' }, 'EXCEL').subscribe();
    const exportRequest = http.expectOne(
      (request) => request.url.endsWith('/audit/exports') && request.method === 'POST',
    );
    expect(exportRequest.request.body.format).toBe('EXCEL');
    exportRequest.flush({ data: { id: 'e1' } });

    gateway.getExport('e1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/audit/exports/e1'))
      .flush({ data: { id: 'e1' } });

    gateway.downloadExport('e1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/audit/exports/e1/download'))
      .flush(new Blob(['xlsx']));
    http.verify();
  });
});
