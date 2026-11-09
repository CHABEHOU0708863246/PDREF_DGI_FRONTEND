import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IntegrationGateway } from './integration.gateway';

describe('IntegrationGateway', () => {
  let gateway: IntegrationGateway;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IntegrationGateway, provideHttpClient(), provideHttpClientTesting()],
    });
    gateway = TestBed.inject(IntegrationGateway);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('charge les modes', () => {
    let value = '';
    gateway.modes().subscribe((modes) => (value = modes.eImpots));
    http
      .expectOne((request) => request.url.endsWith('/api/v1/integrations/modes'))
      .flush({
        success: true,
        data: { eImpots: 'MANUEL', signature: 'MANUEL' },
      });
    expect(value).toBe('MANUEL');
  });
});
