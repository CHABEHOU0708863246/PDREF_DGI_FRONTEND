import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { RejetGateway } from './rejet.gateway';

describe('RejetGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(RejetGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('couvre liste, detail, motifs, creation, reprise et abandon', () => {
    const { gateway, http } = setup();
    gateway.list({ search: '2026', statut: 'CORRIGE' }).subscribe();
    const list = http.expectOne((request) => request.url.endsWith('/rejets'));
    expect(list.request.params.get('search')).toBe('2026');
    expect(list.request.params.get('statut')).toBe('CORRIGE');
    list.flush({ data: { items: [] } });

    gateway.get('r1').subscribe();
    http.expectOne((request) => request.url.endsWith('/rejets/r1')).flush({ data: { id: 'r1' } });

    gateway.motifs().subscribe();
    http.expectOne((request) => request.url.endsWith('/rejets/motifs')).flush({ data: [] });

    gateway
      .create('d1', { motifCode: 'PIECE_JUSTIFICATIVE_MANQUANTE', commentaire: 'Motif valide' })
      .subscribe();
    http
      .expectOne(
        (request) => request.url.endsWith('/demandes/d1/rejets') && request.method === 'POST',
      )
      .flush({ data: { id: 'r1' } });

    gateway.reprendre('r1').subscribe();
    http
      .expectOne(
        (request) => request.url.endsWith('/rejets/r1/reprendre') && request.method === 'POST',
      )
      .flush({ data: { id: 'r1' } });

    gateway.abandonner('r1', 'Motif abandon valide').subscribe();
    http
      .expectOne(
        (request) => request.url.endsWith('/rejets/r1/abandonner') && request.method === 'POST',
      )
      .flush({ data: { id: 'r1' } });
    http.verify();
  });
});
