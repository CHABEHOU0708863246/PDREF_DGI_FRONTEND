import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { CorrelationService } from '../services/correlation/correlation.service';
import { NotificationService } from '../services/notifications/notification.service';
import { ProblemStore } from '../services/errors/problem.store';
import { isAuthApiUrl } from '../utils/url';
import { normalizeProblem } from '../utils/problem';

/**
 * Mappe tout echec vers le contrat problem+json et affiche code + detail +
 * traceId + reference. Les endpoints d'authentification sont exclus : le
 * formulaire de login gere ses erreurs et le bootstrap reste silencieux.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const notifications = inject(NotificationService);
  const problemStore = inject(ProblemStore);
  const correlation = inject(CorrelationService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (isAuthApiUrl(request.url)) {
        return throwError(() => error);
      }

      const problem = normalizeProblem(error, correlation.last);
      problemStore.set(problem);
      notifications.showProblem(problem);
      return throwError(() => problem);
    }),
  );
};
