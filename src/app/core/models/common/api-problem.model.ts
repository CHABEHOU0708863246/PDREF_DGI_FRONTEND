/**
 * Contrat problem+json RFC 9457 expose par le back-end PDREF.
 * Les noms sont ceux du contrat problem+json : type, title, status, detail, instance,
 * code, traceId, reference, errors[].
 */
export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string | null;
  instance?: string | null;
  code: string;
  traceId: string;
  reference?: string | null;
  errors?: ApiFieldError[] | null;
}

export const ERROR_CODES = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE: 'DUPLICATE',
  CONFLICT: 'CONFLICT',
  CONCURRENCY_CONFLICT: 'CONCURRENCY_CONFLICT',
  PRECONDITION_FAILED: 'PRECONDITION_FAILED',
  BUSINESS_RULE: 'BUSINESS_RULE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTEGRATION_NOT_CONFIGURED: 'INTEGRATION_NOT_CONFIGURED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export function isApiProblemDetails(value: unknown): value is ApiProblemDetails {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['type'] === 'string' &&
    typeof candidate['title'] === 'string' &&
    typeof candidate['status'] === 'number' &&
    typeof candidate['code'] === 'string' &&
    typeof candidate['traceId'] === 'string'
  );
}
