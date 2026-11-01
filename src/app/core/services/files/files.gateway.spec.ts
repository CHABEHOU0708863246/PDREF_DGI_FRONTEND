import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { FilesGateway } from './files.gateway';

describe('FilesGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return { gateway: TestBed.inject(FilesGateway), http: TestBed.inject(HttpTestingController) };
  }

  it('lit la politique et la liste', () => {
    const { gateway, http } = setup();
    gateway.policy('DEMANDE').subscribe();
    const policyRequest = http.expectOne((r) => r.url.endsWith('/files/policy'));
    expect(policyRequest.request.params.get('ownerType')).toBe('DEMANDE');
    policyRequest.flush({ data: {} });
    gateway.list().subscribe();
    http.expectOne((r) => r.url.endsWith('/files')).flush({ data: [] });
    http.verify();
  });

  it('envoie et remplace un fichier', () => {
    const { gateway, http } = setup();
    const file = new File(['pdf'], 'a.pdf', { type: 'application/pdf' });
    gateway.upload(file).subscribe();
    http.expectOne((r) => r.url.endsWith('/files') && r.method === 'POST').flush({ data: {} });
    gateway.replace('g1', file).subscribe();
    http.expectOne((r) => r.url.endsWith('/files/g1/versions')).flush({ data: {} });
    http.verify();
  });

  it('telecharge avec le nom de fichier securise', () => {
    const { gateway, http } = setup();
    gateway.download('v1').subscribe((result) => expect(result.fileName).toBe('facture.pdf'));
    const request = http.expectOne((r) => r.url.endsWith('/files/v1/download'));
    request.flush(new Blob(['x']), {
      headers: { 'content-disposition': "attachment; filename*=UTF-8''facture.pdf" },
    });
    http.verify();
  });
});
