import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CorrelationService } from '../services/correlation/correlation.service';
import { ProblemStore } from '../services/errors/problem.store';
import { NotificationService } from '../services/notifications/notification.service';
import { errorInterceptor } from './error.interceptor';

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([errorInterceptor])),
      provideHttpClientTesting(),
      NotificationService,
      ProblemStore,
      CorrelationService,
      { provide: PLATFORM_ID, useValue: 'browser' },
    ],
  });
  return {
    http: TestBed.inject(HttpClient),
    controller: TestBed.inject(HttpTestingController),
    notifications: TestBed.inject(NotificationService),
    problems: TestBed.inject(ProblemStore),
  };
}

describe('errorInterceptor', () => {
  it('mappe un problem+json et affiche code, detail et trace', () => {
    const { http, controller, notifications, problems } = setup();
    let received: unknown;

    http.get('/api/v1/demandes').subscribe({
      error: (error: unknown) => (received = error),
    });

    controller.expectOne('/api/v1/demandes').flush(
      {
        type: 'urn:pdref:error:RG-18',
        title: 'Trois avis requis',
        status: 422,
        detail: 'Les avis sont incomplets.',
        code: 'RG-18',
        traceId: 'trace-42',
        reference: 'ERR-2026-42',
        errors: [{ field: 'ncc', message: 'NCC obligatoire.' }],
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    expect(problems.lastProblem()?.code).toBe('RG-18');
    expect(notifications.toasts()[0]?.traceId).toBe('trace-42');
    expect((received as { code: string }).code).toBe('RG-18');
  });

  it('ne divulgue pas le message technique', () => {
    const { http, controller, problems } = setup();
    http.get('/api/v1/demandes').subscribe({ error: () => undefined });
    controller.expectOne('/api/v1/demandes').flush('boom', {
      status: 500,
      statusText: 'Internal Server Error',
    });

    expect(problems.lastProblem()?.detail).toBeNull();
    expect(problems.lastProblem()?.code).toBe('INTERNAL_ERROR');
  });

  it('reste silencieux sur les endpoints auth', () => {
    const { http, controller, notifications } = setup();
    let errorSeen = false;

    http.post('/api/v1/auth/login', {}).subscribe({
      error: (error: unknown) => {
        errorSeen = error instanceof HttpErrorResponse;
      },
    });

    controller
      .expectOne('/api/v1/auth/login')
      .flush({ code: 'UNAUTHENTICATED' }, { status: 401, statusText: 'Unauthorized' });

    expect(errorSeen).toBe(true);
    expect(notifications.toasts()).toHaveLength(0);
  });
});
