import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CourriersGateway } from './courriers.gateway';

const item = {
  id: 'cr1',
  sens: 'ENTRANT',
  typeCourrier: 'COURRIER',
  numero: 'C-001',
  dateArrivee: '2026-11-05T00:00:00Z',
  dateEmission: null,
  references: null,
  expediteur: 'DGI',
  objet: 'Objet',
  imputation: 'GUDEF',
  estLie: false,
  contribuable: null,
  createdAt: '2026-11-05T00:00:00Z',
  instructionsDirecteur: null,
  annotationsSdGudef: null,
  demandeId: null,
  signatureStatut: null,
  signatureReference: null,
  signatureLe: null,
  depotEImpotsStatut: null,
  depotEImpotsLe: null,
  referenceDepot: null,
  updatedAt: null,
  version: 1,
};

describe('CourriersGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(CourriersGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('liste, lit, cree et met a jour', () => {
    const { gateway, http } = setup();
    gateway.list({ typeCourrier: 'COURRIER', sens: 'ENTRANT', page: 1 }).subscribe();
    const list = http.expectOne((request) => request.url.endsWith('/courriers'));
    expect(list.request.params.get('typeCourrier')).toBe('COURRIER');
    list.flush({ data: { items: [item], page: 1, pageSize: 20, totalCount: 1 } });

    gateway.get('cr1').subscribe();
    http.expectOne((request) => request.url.endsWith('/courriers/cr1')).flush({ data: item });

    gateway.create({ numero: 'C-002', expediteur: 'DGI', objet: 'Test' }).subscribe();
    http.expectOne((request) => request.url.endsWith('/courriers')).flush({ data: item });

    gateway.update('cr1', { objet: 'Modifie' }).subscribe();
    http.expectOne((request) => request.url.endsWith('/courriers/cr1')).flush({ data: item });
    http.verify();
  });

  it('liste les courriers a signer et execute les actions manuelles', () => {
    const { gateway, http } = setup();
    gateway.aSigner('C-1').subscribe((items) => expect(items).toHaveLength(0));
    const signerList = http.expectOne((request) =>
      request.url.endsWith('/courriers-manuels/a-signer'),
    );
    expect(signerList.request.params.get('search')).toBe('C-1');
    signerList.flush({ data: [] });

    const file = new File(['pdf'], 'signe.pdf', { type: 'application/pdf' });
    gateway.signerManuel('cr1', file, 'DG', '2026-11-09').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/courriers-manuels/cr1/signature'))
      .flush({ data: {} });

    gateway.declarerRemise('cr1', 'REMISE_PAPIER', '2026-11-09', 'REM-1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/courriers-manuels/cr1/remise'))
      .flush({ data: {} });
    http.verify();
  });

  it('recherche, charge les expediteurs et les pieces jointes', () => {
    const { gateway, http } = setup();
    gateway.lookup('C-0').subscribe((items) => expect(items).toHaveLength(1));
    http
      .expectOne((request) => request.url.endsWith('/courriers/lookup'))
      .flush({
        data: [
          {
            id: 'cr1',
            numero: 'C-001',
            objet: 'Objet',
            sens: 'ENTRANT',
            typeCourrier: 'COURRIER',
            date: '2026-11-05T00:00:00Z',
          },
        ],
      });

    gateway.expediteurs('DG').subscribe((items) => expect(items).toEqual(['DGI']));
    http
      .expectOne((request) => request.url.endsWith('/courriers/expediteurs'))
      .flush({ data: ['DGI'] });

    gateway.attachments('cr1').subscribe((items) => expect(items).toHaveLength(0));
    http
      .expectOne((request) => request.url.endsWith('/courriers/cr1/pieces-jointes'))
      .flush({ data: [] });
    http.verify();
  });
});

describe('CourriersGateway download', () => {
  it('telecharge une piece jointe', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const gateway = TestBed.inject(CourriersGateway);
    const http = TestBed.inject(HttpTestingController);
    gateway
      .downloadAttachment('cr1', 'fv1')
      .subscribe((file) => expect(file.fileName).toBe('courrier.pdf'));
    const request = http.expectOne((item) =>
      item.url.endsWith('/courriers/cr1/pieces-jointes/fv1/download'),
    );
    request.flush(new Blob(['x']), {
      headers: { 'content-disposition': 'attachment; filename="courrier.pdf"' },
    });
    http.verify();
  });
});
