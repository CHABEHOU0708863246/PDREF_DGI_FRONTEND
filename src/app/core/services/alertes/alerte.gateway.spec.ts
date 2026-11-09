import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AlerteGateway } from './alerte.gateway';

describe('AlerteGateway', () => {
  it('couvre liste et statistiques', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const gateway = TestBed.inject(AlerteGateway);
    const http = TestBed.inject(HttpTestingController);
    gateway.list({ statut: 'OUVERTE', directionId: 'GUDEF' }).subscribe();
    const list = http.expectOne((request) => request.url.endsWith('/alertes'));
    expect(list.request.params.get('statut')).toBe('OUVERTE');
    expect(list.request.params.get('directionId')).toBe('GUDEF');
    list.flush({ data: { items: [] } });

    gateway.stats({ granularite: 'mois' }).subscribe();
    const stats = http.expectOne((request) => request.url.endsWith('/alertes/stats'));
    expect(stats.request.params.get('granularite')).toBe('mois');
    stats.flush({ data: { points: [] } });
    http.verify();
  });
});
