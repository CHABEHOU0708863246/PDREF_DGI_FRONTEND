import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { buildProblem, normalizeProblem, sanitizeDetail, statusToCode } from './problem';

describe('problem+json', () => {
  it('conserve le contrat backend', () => {
    const problem = normalizeProblem(
      new HttpErrorResponse({
        status: 422,
        error: {
          type: 'urn:pdref:error:RG-18',
          title: 'Trois avis requis',
          status: 422,
          detail: 'Les trois avis doivent etre rendus.',
          code: 'RG-18',
          traceId: 'trace-123',
          reference: 'ERR-2026-1',
          errors: [{ field: 'ncc', message: 'NCC obligatoire.' }],
        },
      }),
      'trace-fallback',
    );

    expect(problem.code).toBe('RG-18');
    expect(problem.traceId).toBe('trace-123');
    expect(problem.reference).toBe('ERR-2026-1');
    expect(problem.errors).toHaveLength(1);
  });

  it('ne divulgue jamais le message technique brut', () => {
    const problem = normalizeProblem(
      new HttpErrorResponse({
        status: 500,
        error: new Error('NullReferenceException at Secret.Service'),
      }),
      null,
    );

    expect(problem.detail).toBeNull();
    expect(problem.title).toBe('Erreur technique');
    expect(problem.code).toBe('INTERNAL_ERROR');
    expect(problem.traceId.length).toBeGreaterThan(0);
  });

  it('mappe les statuts avec un code stable', () => {
    expect(statusToCode(0)).toBe('NETWORK_ERROR');
    expect(statusToCode(400)).toBe('VALIDATION_FAILED');
    expect(statusToCode(401)).toBe('UNAUTHENTICATED');
    expect(statusToCode(403)).toBe('PERMISSION_DENIED');
    expect(statusToCode(404)).toBe('NOT_FOUND');
    expect(statusToCode(409)).toBe('CONFLICT');
    expect(statusToCode(412)).toBe('PRECONDITION_FAILED');
    expect(statusToCode(413)).toBe('FILE_TOO_LARGE');
    expect(statusToCode(415)).toBe('FILE_TYPE_NOT_ALLOWED');
    expect(statusToCode(422)).toBe('BUSINESS_RULE');
    expect(statusToCode(429)).toBe('RATE_LIMITED');
    expect(statusToCode(503)).toBe('SERVICE_UNAVAILABLE');
    expect(statusToCode(504)).toBe('SERVICE_UNAVAILABLE');
    expect(statusToCode(500)).toBe('INTERNAL_ERROR');
  });

  it('gere une erreur reseau et une erreur inconnue', () => {
    const network = normalizeProblem(new HttpErrorResponse({ status: 0, error: null }), null);
    expect(network.code).toBe('NETWORK_ERROR');

    const unknown = normalizeProblem({ strange: true }, null);
    expect(unknown.code).toBe('INTERNAL_ERROR');
  });

  it('filtre les erreurs de champ invalides et les titres techniques', () => {
    const result = normalizeProblem(
      new HttpErrorResponse({
        status: 422,
        error: {
          type: 'urn:pdref:error:RG-1',
          title: 'Exception: stack trace',
          status: 422,
          code: 'BUSINESS_RULE',
          traceId: 'trace',
          errors: [{ field: 'a', message: 'ok' }, { field: 1, message: 'invalide' }, null],
        },
      }),
      null,
    );

    expect(result.errors).toHaveLength(1);
    expect(result.title).toBe('Action impossible');
  });

  it('nettoie les details techniques et le HTML', () => {
    expect(sanitizeDetail('<b>ok</b>')).toBe('ok');
    expect(sanitizeDetail('Exception: stack trace')).toBeNull();
    expect(sanitizeDetail('x'.repeat(301))).toBeNull();
    expect(sanitizeDetail('   ')).toBeNull();
    expect(sanitizeDetail(42)).toBeNull();
  });

  it('construit une erreur de session', () => {
    const problem = buildProblem('SESSION_EXPIRED', 401, 'Session expiree', 'trace-1');
    expect(problem.code).toBe('SESSION_EXPIRED');
    expect(problem.status).toBe(401);
    expect(problem.traceId).toBe('trace-1');
  });
});
