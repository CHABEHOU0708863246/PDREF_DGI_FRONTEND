import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ImputationGateway } from './imputation.gateway';

describe('ImputationGateway', () => {
  it('couvre liste, agents, instructions et attribution', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const gateway = TestBed.inject(ImputationGateway);
    const http = TestBed.inject(HttpTestingController);

    gateway.list({ aDistribuer: true, pageSize: 50 }).subscribe();
    const list = http.expectOne((request) => request.url.endsWith('/imputations'));
    expect(list.request.params.get('aDistribuer')).toBe('true');
    expect(list.request.params.get('pageSize')).toBe('50');
    list.flush({ data: { items: [], totalCount: 0 } });

    gateway.agents().subscribe();
    http.expectOne((request) => request.url.endsWith('/imputations/agents')).flush({ data: [] });

    gateway.instructions().subscribe();
    http
      .expectOne((request) => request.url.endsWith('/imputations/instructions'))
      .flush({ data: [] });

    gateway.assign('d1', 'u1', null).subscribe();
    const assign = http.expectOne(
      (request) => request.url.endsWith('/imputations/d1/attribuer') && request.method === 'POST',
    );
    expect(assign.request.body).toEqual({ userId: 'u1', instruction: null });
    assign.flush({ data: { demandeId: 'd1' } });
    http.verify();
  });
});
