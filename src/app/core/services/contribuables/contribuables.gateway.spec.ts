import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ContribuablesGateway } from './contribuables.gateway';

describe('ContribuablesGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(ContribuablesGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('lit la liste filtree et la qualite', () => {
    const { gateway, http } = setup();
    gateway.list({ search: 'Alpha', sansEmail: true, page: 2 }).subscribe();
    const list = http.expectOne((request) => request.url.endsWith('/contribuables'));
    expect(list.request.params.get('search')).toBe('Alpha');
    expect(list.request.params.get('sansEmail')).toBe('true');
    expect(list.request.params.get('page')).toBe('2');
    list.flush({ data: { items: [], page: 2, pageSize: 20, totalCount: 0 } });

    gateway.quality().subscribe();
    http.expectOne((request) => request.url.endsWith('/contribuables/qualite')).flush({ data: {} });
    http.verify();
  });

  it('lit une fiche, revele les PII et mute', () => {
    const { gateway, http } = setup();
    gateway.get('c1', true).subscribe();
    const get = http.expectOne((request) => request.url.endsWith('/contribuables/c1'));
    expect(get.request.params.get('revealPii')).toBe('true');
    get.flush({ data: { id: 'c1' } });

    gateway
      .create({ ncc: '1', raisonSociale: 'A', systemeComptable: 'S', centreImpotId: 'C' })
      .subscribe();
    http
      .expectOne((request) => request.url.endsWith('/contribuables') && request.method === 'POST')
      .flush({ data: { id: 'c1' } });
    gateway.archive('c1').subscribe();
    http.expectOne((request) => request.url.endsWith('/contribuables/c1/archive')).flush({});
    gateway.syncEImpots('c1').subscribe();
    http.expectOne((request) => request.url.endsWith('/contribuables/c1/sync-eimpots')).flush({});
    http.verify();
  });

  it('exporte en CSV avec le nom de fichier', () => {
    const { gateway, http } = setup();
    gateway
      .export({}, 'csv')
      .subscribe((result) => expect(result.fileName).toBe('contribuables.csv'));
    const request = http.expectOne((request) => request.url.endsWith('/contribuables/export'));
    expect(request.request.params.get('format')).toBe('csv');
    request.flush(new Blob(['csv']), {
      headers: { 'content-disposition': 'attachment; filename="contribuables.csv"' },
    });
    http.verify();
  });
});
