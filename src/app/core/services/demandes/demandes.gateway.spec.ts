import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DemandesGateway } from './demandes.gateway';

describe('DemandesGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(DemandesGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('couvre formulaire, liste, detail et mutations', () => {
    const { gateway, http } = setup();
    gateway.formulaire().subscribe();
    http
      .expectOne((r) => r.url.endsWith('/demandes/formulaire'))
      .flush({ data: { exercices: [] } });

    gateway.list({ statut: 'EN_CIRCUIT', search: 'alpha', page: 2 }).subscribe();
    const list = http.expectOne((r) => r.url.endsWith('/demandes'));
    expect(list.request.params.get('statut')).toBe('EN_CIRCUIT');
    expect(list.request.params.get('page')).toBe('2');
    list.flush({ data: { items: [], page: 2, pageSize: 20, totalCount: 0 } });

    gateway.get('d1').subscribe();
    http.expectOne((r) => r.url.endsWith('/demandes/d1')).flush({ data: { id: 'd1' } });

    gateway.create({ exercices: [] }).subscribe();
    http
      .expectOne((r) => r.url.endsWith('/demandes') && r.method === 'POST')
      .flush({ data: { id: 'd1', version: 1 } });

    gateway.update('d1', { exercices: [] }, 3).subscribe();
    const update = http.expectOne((r) => r.url.endsWith('/demandes/d1') && r.method === 'PUT');
    expect(update.request.headers.get('If-Match')).toBe('"3"');
    update.flush({ data: { id: 'd1', version: 4 } });
    http.verify();
  });

  it('couvre export et pieces jointes', () => {
    const { gateway, http } = setup();
    gateway.export('d1').subscribe((pdf) => expect(pdf.fileName).toBe('demande.pdf'));
    const exportRequest = http.expectOne((r) => r.url.endsWith('/demandes/d1/export'));
    exportRequest.flush(new Blob(['pdf']), {
      headers: { 'content-disposition': 'attachment; filename="demande.pdf"' },
    });

    gateway.attachments('d1').subscribe();
    http.expectOne((r) => r.url.endsWith('/demandes/d1/pieces-jointes')).flush({ data: [] });

    const file = new File(['pdf'], 'demande.pdf', { type: 'application/pdf' });
    gateway.uploadAttachment('d1', file).subscribe();
    http
      .expectOne((r) => r.url.endsWith('/demandes/d1/pieces-jointes') && r.method === 'POST')
      .flush({ data: {} });

    gateway
      .downloadAttachment('d1', 'v1')
      .subscribe((result) => expect(result.fileName).toBe('pj.pdf'));
    const download = http.expectOne((r) =>
      r.url.endsWith('/demandes/d1/pieces-jointes/v1/download'),
    );
    download.flush(new Blob(['x']), {
      headers: { 'content-disposition': "attachment; filename*=UTF-8''pj.pdf" },
    });
    http.verify();
  });
});
