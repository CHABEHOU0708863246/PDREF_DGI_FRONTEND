import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SuivisGateway } from './suivis.gateway';

describe('SuivisGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(SuivisGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('couvre liste, detail, motifs et export', () => {
    const { gateway, http } = setup();
    gateway.list({ search: 'alpha', statut: 'AVIS_EN_COURS', page: 2 }).subscribe();
    const list = http.expectOne((request) => request.url.endsWith('/suivis'));
    expect(list.request.params.get('search')).toBe('alpha');
    expect(list.request.params.get('page')).toBe('2');
    list.flush({ data: { items: [], page: 2, pageSize: 20, totalCount: 0 } });

    gateway.get('d1').subscribe();
    http.expectOne((request) => request.url.endsWith('/suivis/d1')).flush({ data: { id: 's1' } });

    gateway.motifs().subscribe();
    http
      .expectOne((request) => request.url.endsWith('/suivis/motifs'))
      .flush({ data: [{ code: 'AUTRE', libelle: 'Autre' }] });

    gateway.exportBase({}).subscribe((result) => expect(result.fileName).toBe('base.xlsx'));
    http
      .expectOne((request) => request.url.endsWith('/suivis/base-demandes'))
      .flush(new Blob(['xlsx']), {
        headers: { 'content-disposition': 'attachment; filename="base.xlsx"' },
      });
    http.verify();
  });

  it('couvre les mutations et la signature', () => {
    const { gateway, http } = setup();
    gateway
      .decideAvis('d1', 'AVIS_DERAR', {
        decision: 'FAVORABLE',
        article24: {
          insuffisanceMemeNature3Ans: null,
          engagementRedressementEnCours: null,
          avisVerificationComptabilite: null,
          verificationApprofondieEnCours: null,
        },
      })
      .subscribe();
    http
      .expectOne(
        (request) =>
          request.url.endsWith('/demandes/d1/avis/AVIS_DERAR/decision') &&
          request.method === 'POST',
      )
      .flush({ data: { id: 's1' } });

    gateway.decideValidation('d1', { decision: 'FAVORABLE' }).subscribe();
    http
      .expectOne(
        (request) => request.url.endsWith('/demandes/d1/validation') && request.method === 'POST',
      )
      .flush({ data: { id: 's1' } });

    gateway
      .correct('d1', {
        cibleType: 'AVIS',
        cibleId: 'a1',
        nouvelleDecision: 'NON_FAVORABLE',
        motif: 'motif suffisant',
      })
      .subscribe();
    http
      .expectOne(
        (request) => request.url.endsWith('/demandes/d1/corrections') && request.method === 'POST',
      )
      .flush({ data: { id: 'c1' } });

    gateway
      .transmit('d1', { destinataireUserIds: ['u1'], commentaireInterne: 'interne' })
      .subscribe();
    http
      .expectOne(
        (request) =>
          request.url.endsWith('/demandes/d1/transmissions') && request.method === 'POST',
      )
      .flush({ data: { id: 't1' } });

    gateway.signature('d1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/demandes/d1/courrier-reponse/signature'))
      .flush({ data: { jobId: 'j1', courrierId: 'c1', statut: 'EN_ATTENTE' } });

    gateway.depot('d1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/demandes/d1/courrier-reponse/depot'))
      .flush({ data: { courrierId: 'c1', statut: 'DEPOSE', referenceDepot: 'R1' } });
    http.verify();
  });
});
