import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PublicSuiviGateway } from './public-suivi.gateway';

describe('PublicSuiviGateway', () => {
  let gateway: PublicSuiviGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PublicSuiviGateway, provideHttpClient(), provideHttpClientTesting()],
    });
    gateway = TestBed.inject(PublicSuiviGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envoie NCC et e-mail dans le corps, jamais dans l URL', () => {
    gateway.search({ ncc: '1234567A', email: 'user@example.com' }).subscribe();
    const request = http.expectOne((item) => item.url.endsWith('/api/v1/public/suivi'));
    expect(request.request.method).toBe('POST');
    expect(request.request.url).not.toContain('?');
    expect(request.request.body).toEqual({ ncc: '1234567A', email: 'user@example.com' });
    request.flush({ success: true, data: { trouve: false, message: 'test', dossiers: [] } });
  });

  it('transforme un 404 en reponse neutre', () => {
    let message = '';
    gateway.search({ ncc: 'bad', email: 'bad' }).subscribe((result) => (message = result.message));
    const request = http.expectOne((item) => item.url.endsWith('/api/v1/public/suivi'));
    request.flush({ success: false, message: 'neutre' }, { status: 404, statusText: 'Not Found' });
    expect(message).toBe('Aucun dossier trouvé avec ces informations.');
  });
});
