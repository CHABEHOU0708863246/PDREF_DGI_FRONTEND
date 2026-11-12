import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, it } from 'vitest';
import { DepotGateway } from './depot.gateway';

describe('DepotGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(DepotGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('couvre les endpoints du depot en ligne', () => {
    const { gateway, http } = setup();
    const draft = {
      id: 'd1',
      numero: null,
      statut: 'BROUILLON',
      etape: 1,
      version: 1,
      updatedAt: null,
      derniereSauvegarde: null,
      abandonneLe: null,
      referenceDepot: null,
      contribuable: {
        id: 'c1',
        ncc: '1234567A',
        raisonSociale: 'X',
        centreImpotId: 'GUDEF',
        centreImpotLibelle: null,
        directionRattachementId: 'DGE',
      },
      exercices: [],
      conformite: {
        statut: 'EN_ATTENTE',
        champsManquants: [],
        motifRejetCode: null,
        verifieLe: null,
      },
    };

    gateway.activation().subscribe();
    http
      .expectOne((request) => request.url.endsWith('/espace/depots/activation'))
      .flush({ data: { actif: true } });

    gateway.formulaire().subscribe();
    http
      .expectOne((request) => request.url.endsWith('/espace/depots/formulaire'))
      .flush({
        data: {
          exercices: [],
          etatsFinanciers: [],
          motifs: [],
          champsConformite: [],
          variablesMax: 20,
          variablesMaxParExercice: 25,
          pdfMinimum: 1,
          plausibiliteSeuilPct: null,
        },
      });

    gateway.drafts().subscribe();
    http
      .expectOne((request) => request.url.endsWith('/espace/depots/brouillons'))
      .flush({ data: [] });

    gateway.draft('d1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/espace/depots/brouillons/d1'))
      .flush({ data: draft });

    gateway.create({ etape: 1, version: 0, referenceDepot: null, exercices: [] }).subscribe();
    http
      .expectOne(
        (request) => request.url.endsWith('/espace/depots/brouillons') && request.method === 'POST',
      )
      .flush({ data: draft });

    gateway.save('d1', { etape: 2, version: 1, referenceDepot: null, exercices: [] }).subscribe();
    http
      .expectOne(
        (request) =>
          request.url.endsWith('/espace/depots/brouillons/d1') && request.method === 'PUT',
      )
      .flush({ data: draft });

    gateway
      .validateStep('d1', 2, { etape: 2, version: 1, referenceDepot: null, exercices: [] })
      .subscribe();
    http
      .expectOne((request) => request.url.endsWith('/espace/depots/brouillons/d1/etapes/2/valider'))
      .flush({ data: draft });

    gateway.pieces('d1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/espace/depots/brouillons/d1/pieces'))
      .flush({ data: [] });

    gateway.uploadPiece('d1', new File(['x'], 'depot.pdf')).subscribe();
    http
      .expectOne(
        (request) =>
          request.url.endsWith('/espace/depots/brouillons/d1/pieces') && request.method === 'POST',
      )
      .flush({ data: {} });

    gateway.deposit('d1', 'key').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/espace/depots/brouillons/d1/deposer'))
      .flush({
        data: { demande: {}, accuseUrl: '/api/v1/espace/depots/d1/accuse' },
      });

    gateway.accuse('d1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/espace/depots/d1/accuse'))
      .flush(new Blob(['pdf']));

    http.verify();
  });
});
