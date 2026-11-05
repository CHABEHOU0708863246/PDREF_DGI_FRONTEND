import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { HttpContribuableLookup } from './contribuable-lookup';

describe('HttpContribuableLookup', () => {
  it('recherche et mappe les options', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const lookup = TestBed.inject(HttpContribuableLookup);
    const http = TestBed.inject(HttpTestingController);
    lookup.search('Alpha', 8).subscribe((options) => {
      expect(options).toHaveLength(1);
      expect(options[0]?.label).toBe('Client Alpha');
      expect(options[0]?.sub).toBe('123****7A');
    });
    const request = http.expectOne((item) => item.url.endsWith('/contribuables/lookup'));
    expect(request.request.params.get('term')).toBe('Alpha');
    request.flush({ data: [{ id: 'c1', raisonSociale: 'Client Alpha', nccMasque: '123****7A' }] });
    http.verify();
  });
});
