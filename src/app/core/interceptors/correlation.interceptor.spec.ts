import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CorrelationService } from '../services/correlation/correlation.service';
import { correlationInterceptor } from './correlation.interceptor';

describe('correlationInterceptor', () => {
  it('ajoute un X-Correlation-Id valide et le memorise', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationInterceptor])),
        provideHttpClientTesting(),
        CorrelationService,
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    const correlation = TestBed.inject(CorrelationService);

    http.get('/api/v1/demo').subscribe();
    const request = controller.expectOne('/api/v1/demo');
    const id = request.request.headers.get('X-Correlation-Id');

    expect(id).toBeTruthy();
    expect(correlation.last).toBe(id);
    request.flush({});
    controller.verify();
  });

  it('conserve un identifiant fourni valide', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationInterceptor])),
        provideHttpClientTesting(),
        CorrelationService,
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);

    http.get('/api/v1/demo', { headers: { 'X-Correlation-Id': 'corr-42' } }).subscribe();
    const request = controller.expectOne('/api/v1/demo');
    expect(request.request.headers.get('X-Correlation-Id')).toBe('corr-42');
    request.flush({});
  });
});
