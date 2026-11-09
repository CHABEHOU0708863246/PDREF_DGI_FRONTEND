import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DashboardGateway } from './dashboard.gateway';

describe('DashboardGateway', () => {
  it('couvre kpis, nominatif et qualite', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const gateway = TestBed.inject(DashboardGateway);
    const http = TestBed.inject(HttpTestingController);
    gateway.kpis({ periode: '7j' }).subscribe();
    const kpis = http.expectOne((request) => request.url.endsWith('/dashboard/kpis'));
    expect(kpis.request.params.get('periode')).toBe('7j');
    kpis.flush({ data: { totalDemandes: 1 } });
    gateway.nominatif({ page: 2 }).subscribe();
    const nominatif = http.expectOne((request) => request.url.endsWith('/dashboard/nominatif'));
    expect(nominatif.request.params.get('page')).toBe('2');
    nominatif.flush({ data: { items: [] } });
    gateway.qualite().subscribe();
    http.expectOne((request) => request.url.endsWith('/dashboard/qualite')).flush({ data: {} });
    http.verify();
  });
});
