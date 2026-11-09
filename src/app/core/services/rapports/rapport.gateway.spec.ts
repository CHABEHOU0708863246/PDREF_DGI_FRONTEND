import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import { RapportGateway } from './rapport.gateway';

describe('RapportGateway', () => {
  let gateway: RapportGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RapportGateway, provideHttpClient(), provideHttpClientTesting()],
    });
    gateway = TestBed.inject(RapportGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('transmet les filtres et recupere les exports', () => {
    gateway.get({ type: 'MENSUEL', dateReference: '2026-11-09', directionId: 'GUDEF' }).subscribe();
    const report = http.expectOne(
      (request) =>
        request.url.endsWith('/api/v1/rapports') &&
        request.params.get('type') === 'MENSUEL' &&
        request.params.get('directionId') === 'GUDEF',
    );
    expect(report.request.method).toBe('GET');
    report.flush({ success: true, data: { lignes: [], legende: [] } });

    gateway.createExport({ type: 'MENSUEL', format: 'PDF' }).subscribe();
    const created = http.expectOne((request) => request.url.endsWith('/api/v1/rapports/exports'));
    expect(created.request.method).toBe('POST');
    created.flush({ success: true, data: { id: 'e1' } });
  });
});
