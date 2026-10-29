import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AdminGateway } from './admin.gateway';

describe('AdminGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return { gateway: TestBed.inject(AdminGateway), http: TestBed.inject(HttpTestingController) };
  }

  it('lit et filtre les directions', () => {
    const { gateway, http } = setup();
    gateway.directions({ search: 'GUDEF', page: 1 }).subscribe();
    const request = http.expectOne((item) => item.url.endsWith('/directions'));
    expect(request.request.params.get('search')).toBe('GUDEF');
    request.flush({ data: { items: [], total: 0, page: 1, pageSize: 25 } });
    http.verify();
  });

  it('cree et met a jour les ressources', () => {
    const { gateway, http } = setup();
    gateway.createDirection({ code: 'X' }).subscribe();
    http
      .expectOne((item) => item.url.endsWith('/directions') && item.method === 'POST')
      .flush({ data: {} });

    gateway.updateFiscalYear('id', { annee: 2026 }).subscribe();
    http
      .expectOne((item) => item.url.endsWith('/exercices/id') && item.method === 'PUT')
      .flush({ data: {} });

    gateway.createValue({ code: 'X' }).subscribe();
    http.expectOne((item) => item.url.endsWith('/listes-valeurs')).flush({ data: {} });

    gateway.updateTemplate('t1', { code: 'X' }).subscribe();
    http.expectOne((item) => item.url.endsWith('/modeles-notifications/t1')).flush({ data: {} });
    http.verify();
  });

  it('active et desactive les exercices et valeurs', () => {
    const { gateway, http } = setup();
    gateway.setFiscalYearActive('y', true, 'motif').subscribe();
    http.expectOne((item) => item.url.endsWith('/exercices/y/activate')).flush({ data: {} });

    gateway.setValueActive('v', false, 'motif').subscribe();
    http.expectOne((item) => item.url.endsWith('/listes-valeurs/v/deactivate')).flush({ data: {} });
    http.verify();
  });

  it('lit l historique et cree une version de parametre', () => {
    const { gateway, http } = setup();
    gateway.parameterHistory('delais.verifGudefJO').subscribe();
    http
      .expectOne((item) => item.url.includes('/parametres/delais.verifGudefJO/history'))
      .flush({ data: [] });

    gateway.createParameterVersion('delais.verifGudefJO', { valeurJson: '3' }).subscribe();
    http
      .expectOne((item) => item.url.includes('/parametres/delais.verifGudefJO/versions'))
      .flush({ data: {} });
    http.verify();
  });
});
