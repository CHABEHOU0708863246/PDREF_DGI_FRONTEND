import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PilotageGateway } from './pilotage.gateway';

describe('PilotageGateway', () => {
  it('appelle drill-down et charge', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const gateway = TestBed.inject(PilotageGateway);
    const http = TestBed.inject(HttpTestingController);
    gateway.drilldown({ source: 'DASHBOARD', metric: 'EN_COURS' }).subscribe();
    const drill = http.expectOne((request) => request.url.endsWith('/pilotage/drilldown'));
    expect(drill.request.params.get('source')).toBe('DASHBOARD');
    drill.flush({ data: { items: [], totalCount: 0 } });

    gateway.workload('GUDEF', 'u1').subscribe();
    const workload = http.expectOne((request) => request.url.endsWith('/pilotage/workload'));
    expect(workload.request.params.get('directionId')).toBe('GUDEF');
    expect(workload.request.params.get('agentUserId')).toBe('u1');
    workload.flush({ data: { agents: [], directions: [] } });
    http.verify();
  });
});
