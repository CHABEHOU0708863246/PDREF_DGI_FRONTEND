import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { RejetPiecesGateway } from './rejet-pieces.gateway';

describe('RejetPiecesGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(RejetPiecesGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('lit et envoie les pieces demandees', () => {
    const { gateway, http } = setup();
    gateway.get('d1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/espace/dossiers/d1/pieces-demandees'))
      .flush({ data: { rejetId: 'r1', envois: [] } });

    const file = new File(['%PDF-1.7 body'], 'preuve.pdf', { type: 'application/pdf' });
    gateway.send('d1', [file], 'Message de correction').subscribe();
    const send = http.expectOne(
      (request) =>
        request.url.endsWith('/espace/dossiers/d1/pieces-demandees') && request.method === 'POST',
    );
    const body = send.request.body as FormData;
    expect(body.get('message')).toBe('Message de correction');
    expect((body.get('files') as File).name).toBe('preuve.pdf');
    send.flush({ data: { rejetId: 'r1', envois: [] } });

    gateway.send('d1', [file], null).subscribe();
    const emptyMessage = http.expectOne(
      (request) =>
        request.url.endsWith('/espace/dossiers/d1/pieces-demandees') && request.method === 'POST',
    );
    expect((emptyMessage.request.body as FormData).get('message')).toBeNull();
    emptyMessage.flush({ data: { rejetId: 'r1', envois: [] } });
    http.verify();
  });
});
