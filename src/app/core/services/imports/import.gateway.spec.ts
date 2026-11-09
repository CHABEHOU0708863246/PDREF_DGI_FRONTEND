import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ImportGateway } from './import.gateway';

describe('ImportGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(ImportGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('couvre liste, detail, erreurs, upload, template et rapport', () => {
    const { gateway, http } = setup();
    gateway.list({ search: 'fichier', statut: 'TERMINE' }).subscribe();
    const list = http.expectOne((request) => request.url.endsWith('/imports'));
    expect(list.request.params.get('search')).toBe('fichier');
    expect(list.request.params.get('statut')).toBe('TERMINE');
    list.flush({ data: { items: [] } });

    gateway.get('i1').subscribe();
    http.expectOne((request) => request.url.endsWith('/imports/i1')).flush({ data: { id: 'i1' } });

    gateway.errors('i1', { colonne: 'dateDepot' }).subscribe();
    const errors = http.expectOne((request) => request.url.endsWith('/imports/i1/erreurs'));
    expect(errors.request.params.get('colonne')).toBe('dateDepot');
    errors.flush({ data: { items: [] } });

    gateway.upload(new File(['x'], 'fichier.xlsx')).subscribe();
    const upload = http.expectOne(
      (request) => request.url.endsWith('/imports') && request.method === 'POST',
    );
    expect(upload.request.body instanceof FormData).toBe(true);
    upload.flush({ data: { id: 'i1' } });

    gateway.downloadTemplate().subscribe();
    const template = http.expectOne((request) => request.url.endsWith('/imports/template'));
    expect(template.request.responseType).toBe('blob');
    template.flush(new Blob(['x']), {
      headers: { 'Content-Disposition': 'attachment; filename="template.xlsx"' },
    });

    gateway.downloadReport('i1', 'xlsx').subscribe();
    const report = http.expectOne((request) => request.url.includes('/imports/i1/rapport'));
    expect(report.request.responseType).toBe('blob');
    report.flush(new Blob(['x']), {
      headers: { 'Content-Disposition': 'attachment; filename="rapport.xlsx"' },
    });
    http.verify();
  });
});
