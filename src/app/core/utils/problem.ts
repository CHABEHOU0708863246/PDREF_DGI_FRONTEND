import { HttpErrorResponse } from '@angular/common/http';
import {
  ERROR_CODES,
  type ApiFieldError,
  type ApiProblemDetails,
  isApiProblemDetails,
} from '../models/common/api-problem.model';
import { isCorrelationId, newCorrelationId } from './correlation';

const TECHNICAL_MESSAGE =
  /(exception|stack\s*trace|internal server error|nullreference|system\.|microsoft\.|\bat\s+\w+\.[\w.]+\()/i;

export function sanitizeDetail(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '');
  if (!trimmed || trimmed.length > 300 || TECHNICAL_MESSAGE.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function statusToCode(status: number): string {
  switch (status) {
    case 0:
      return ERROR_CODES.NETWORK_ERROR;
    case 401:
      return ERROR_CODES.UNAUTHENTICATED;
    case 403:
      return ERROR_CODES.PERMISSION_DENIED;
    case 404:
      return ERROR_CODES.NOT_FOUND;
    case 409:
      return ERROR_CODES.CONFLICT;
    case 412:
      return ERROR_CODES.PRECONDITION_FAILED;
    case 413:
      return ERROR_CODES.FILE_TOO_LARGE;
    case 415:
      return ERROR_CODES.FILE_TYPE_NOT_ALLOWED;
    case 422:
      return ERROR_CODES.BUSINESS_RULE;
    case 429:
      return ERROR_CODES.RATE_LIMITED;
    case 503:
    case 504:
      return ERROR_CODES.SERVICE_UNAVAILABLE;
    default:
      return status >= 500 ? ERROR_CODES.INTERNAL_ERROR : ERROR_CODES.VALIDATION_FAILED;
  }
}

export function normalizeProblem(
  error: HttpErrorResponse | unknown,
  correlationId: string | null,
): ApiProblemDetails {
  if (isApiProblemDetails(error)) {
    return sanitizeProblem(error);
  }

  if (error instanceof HttpErrorResponse) {
    const body = error.error as unknown;
    if (isApiProblemDetails(body)) {
      return sanitizeProblem(body, error.status);
    }

    const status = error.status === 0 ? 0 : error.status;
    const code = statusToCode(status);
    return {
      type: `urn:pdref:error:${code}`,
      title: defaultTitle(code),
      status,
      detail: null,
      instance: error.url,
      code,
      traceId: validTraceId(correlationId),
      reference: null,
      errors: [],
    };
  }

  return {
    type: `urn:pdref:error:${ERROR_CODES.INTERNAL_ERROR}`,
    title: defaultTitle(ERROR_CODES.INTERNAL_ERROR),
    status: 500,
    detail: null,
    instance: null,
    code: ERROR_CODES.INTERNAL_ERROR,
    traceId: validTraceId(correlationId),
    reference: null,
    errors: [],
  };
}

export function buildProblem(
  code: string,
  status: number,
  title: string,
  correlationId: string | null,
  reference: string | null = null,
): ApiProblemDetails {
  return {
    type: `urn:pdref:error:${code}`,
    title,
    status,
    detail: null,
    instance: null,
    code,
    traceId: validTraceId(correlationId),
    reference,
    errors: [],
  };
}

function sanitizeProblem(problem: ApiProblemDetails, fallbackStatus?: number): ApiProblemDetails {
  const errors: ApiFieldError[] = Array.isArray(problem.errors)
    ? problem.errors
        .filter(
          (item): item is ApiFieldError =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as ApiFieldError).field === 'string' &&
            typeof (item as ApiFieldError).message === 'string',
        )
        .map((item) => ({
          field: item.field,
          message: sanitizeDetail(item.message) ?? 'Valeur invalide.',
        }))
    : [];

  return {
    type: typeof problem.type === 'string' ? problem.type : `urn:pdref:error:${problem.code}`,
    title: sanitizeDetail(problem.title) ?? defaultTitle(problem.code),
    status: typeof problem.status === 'number' ? problem.status : (fallbackStatus ?? 500),
    detail: sanitizeDetail(problem.detail),
    instance: typeof problem.instance === 'string' ? problem.instance : null,
    code: problem.code,
    traceId: validTraceId(problem.traceId),
    reference: typeof problem.reference === 'string' ? problem.reference : null,
    errors,
  };
}

function validTraceId(value: string | null | undefined): string {
  return isCorrelationId(value) ? value : newCorrelationId();
}

function defaultTitle(code: string): string {
  switch (code) {
    case ERROR_CODES.NETWORK_ERROR:
      return 'Connexion perdue';
    case ERROR_CODES.UNAUTHENTICATED:
    case ERROR_CODES.SESSION_EXPIRED:
      return 'Session expiree';
    case ERROR_CODES.PERMISSION_DENIED:
      return 'Acces refuse';
    case ERROR_CODES.NOT_FOUND:
      return 'Element introuvable';
    case ERROR_CODES.CONFLICT:
    case ERROR_CODES.CONCURRENCY_CONFLICT:
    case ERROR_CODES.PRECONDITION_FAILED:
      return 'Conflit de donnees';
    case ERROR_CODES.RATE_LIMITED:
      return 'Trop de requetes';
    case ERROR_CODES.SERVICE_UNAVAILABLE:
      return 'Service momentanement indisponible';
    case ERROR_CODES.VALIDATION_FAILED:
      return 'Informations a corriger';
    case ERROR_CODES.BUSINESS_RULE:
      return 'Action impossible';
    default:
      return 'Erreur technique';
  }
}
