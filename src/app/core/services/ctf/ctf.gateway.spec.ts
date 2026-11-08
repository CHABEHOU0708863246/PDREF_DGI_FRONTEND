import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CtfGateway } from './ctf.gateway';

describe('CtfGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(CtfGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('couvre liste, detail, activation et retour', () => {
    const { gateway, http } = setup();
    gateway.aActiver({ search: '2026' }).subscribe();
    const list = http.expectOne((request) => request.url.endsWith('/ctf/a-activer'));
    expect(list.request.params.get('search')).toBe('2026');
    list.flush({ data: [] });

    gateway.list({ statut: 'ACTIVEE' }).subscribe();
    const all = http.expectOne((request) => request.url.endsWith('/ctf'));
    expect(all.request.params.get('statut')).toBe('ACTIVEE');
    all.flush({ data: [] });

    gateway.get('d1').subscribe();
    http.expectOne((request) => request.url.endsWith('/ctf/d1')).flush({ data: { id: 'c1' } });

    gateway.activer('d1').subscribe();
    http
      .expectOne(
        (request) => request.url.endsWith('/ctf/d1/activation') && request.method === 'POST',
      )
      .flush({ data: { id: 'c1' } });

    gateway.retourGudef('d1').subscribe();
    http
      .expectOne(
        (request) => request.url.endsWith('/ctf/d1/retour-gudef') && request.method === 'POST',
      )
      .flush({ data: { id: 'c1' } });
    http.verify();
  });
});
