import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AdhesionGateway } from './adhesion.gateway';

describe('AdhesionGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(AdhesionGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('couvre le parcours public', () => {
    const { gateway, http } = setup();

    gateway.activation().subscribe();
    http
      .expectOne((request) => request.url.endsWith('/public/adhesions/activation'))
      .flush({
        data: { actif: true },
      });

    gateway
      .create({
        ncc: '1234567A',
        nom: 'Diallo',
        prenom: 'Awa',
        fonction: 'Gerante',
        email: 'awa@example.test',
        telephone: '+2250700000009',
      })
      .subscribe();
    http
      .expectOne((request) => request.url.endsWith('/public/adhesions'))
      .flush({
        data: { message: 'ok' },
      });

    gateway.verify('token').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/public/adhesions/verifier-email'))
      .flush({
        data: {
          jeton: 'u',
          emailMasque: 'a***@example.test',
          statut: 'PIECES_A_FOURNIR',
          pieces: [],
        },
      });

    gateway.suivi('u').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/public/adhesions/suivi'))
      .flush({
        data: { statut: 'PIECES_A_FOURNIR', pieces: [], peutSoumettre: false },
      });

    gateway.uploadPiece('u', 'PIECE_IDENTITE', new File(['x'], 'id.pdf')).subscribe();
    http
      .expectOne(
        (request) => request.url.endsWith('/public/adhesions/pieces') && request.method === 'POST',
      )
      .flush({ data: { type: 'PIECE_IDENTITE', fileName: 'id.pdf' } });

    gateway.submit('u').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/public/adhesions/soumettre'))
      .flush({ data: { statut: 'EN_ATTENTE_VALIDATION', pieces: [], peutSoumettre: false } });

    expect(gateway.modeleUrl()).toContain('/public/adhesions/modele-autorisation');
    http.verify();
  });

  it('couvre la file agent', () => {
    const { gateway, http } = setup();

    gateway.list('EN_ATTENTE_VALIDATION', '123').subscribe();
    const list = http.expectOne((request) => request.url.endsWith('/adhesions'));
    expect(list.request.params.get('statut')).toBe('EN_ATTENTE_VALIDATION');
    expect(list.request.params.get('search')).toBe('123');
    list.flush({ data: [] });

    gateway.detail('a1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/adhesions/a1'))
      .flush({
        data: {
          id: 'a1',
          ncc: '1234567A',
          raisonSociale: 'X',
          nom: 'D',
          prenom: 'A',
          fonction: 'F',
          email: 'a@example.test',
          telephone: '+225',
          statut: 'EN_ATTENTE_VALIDATION',
          createdAt: '2026-11-11',
          nccConnu: true,
          emailEcart: false,
          compteActif: false,
          pieces: [],
          motifRefusCode: null,
        },
      });

    gateway.motifs().subscribe();
    http.expectOne((request) => request.url.endsWith('/adhesions/motifs')).flush({ data: [] });

    gateway.accept('a1').subscribe();
    http.expectOne((request) => request.url.endsWith('/adhesions/a1/accepter')).flush({ data: {} });

    gateway.refuse('a1', 'AUTRE').subscribe();
    http.expectOne((request) => request.url.endsWith('/adhesions/a1/refuser')).flush({ data: {} });

    gateway.accounts('123').subscribe();
    http.expectOne((request) => request.url.endsWith('/adhesions/comptes')).flush({ data: [] });

    gateway.deactivate('u1', 'motif').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/adhesions/comptes/u1/desactiver'))
      .flush({ data: {} });

    gateway.reactivate('u1', 'motif').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/adhesions/comptes/u1/reactiver'))
      .flush({ data: {} });

    gateway.downloadPiece('a1', 'v1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/adhesions/a1/pieces/v1/download'))
      .flush(new Blob(['pdf']));

    http.verify();
  });

  it('couvre l espace contribuable', () => {
    const { gateway, http } = setup();

    gateway.dossiers().subscribe();
    http.expectOne((request) => request.url.endsWith('/espace/dossiers')).flush({ data: [] });

    gateway.dossier('d1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/espace/dossiers/d1'))
      .flush({
        data: {
          id: 'd1',
          numero: 'DOS-1',
          statut: 'CLOTUREE',
          dateDepot: null,
          decision: 'FAVORABLE',
          motifRejet: null,
          chronologie: [],
          courrierDisponible: true,
        },
      });

    gateway.downloadCourrier('d1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/espace/dossiers/d1/courrier'))
      .flush(new Blob(['pdf']));

    http.verify();
  });
});
