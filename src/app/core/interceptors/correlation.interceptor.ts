import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CorrelationService } from '../services/correlation/correlation.service';
import { isCorrelationId } from '../utils/correlation';

export const correlationInterceptor: HttpInterceptorFn = (request, next) => {
  const correlation = inject(CorrelationService);
  const existing = request.headers.get('X-Correlation-Id');
  const id = isCorrelationId(existing) ? existing : correlation.next();

  correlation.set(id);

  return next(
    request.clone({
      setHeaders: { 'X-Correlation-Id': id },
    }),
  );
};
