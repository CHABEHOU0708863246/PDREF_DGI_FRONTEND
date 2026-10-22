import { HttpContextToken, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { ERROR_CODES } from '../models/common/api-problem.model';
import { AuthService } from '../services/auth/auth.service';
import { CorrelationService } from '../services/correlation/correlation.service';
import { TokenStore } from '../services/token/token.store';
import { buildProblem } from '../utils/problem';
import { isPublicApiUrl } from '../utils/url';

export const AUTH_RETRIED = new HttpContextToken<boolean>(() => false);

/**
 * Bearer sur les routes protegees. Sur 401 : un seul refresh (partage entre
 * appels paralleles), puis rejeu. Si le refresh echoue : session locale videe,
 * redirection login, aucune boucle.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const tokenStore = inject(TokenStore);
  const correlation = inject(CorrelationService);
  const publicRequest = isPublicApiUrl(request.url);

  const token = tokenStore.getAccessToken();
  const authorizedRequest =
    !publicRequest && token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (
        publicRequest ||
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        request.context.get(AUTH_RETRIED)
      ) {
        return throwError(() => error);
      }

      return auth.refreshOnce().pipe(
        switchMap(() => {
          const refreshedToken = tokenStore.getAccessToken();
          if (!refreshedToken) {
            auth.expireSession();
            return throwError(() =>
              buildProblem(ERROR_CODES.SESSION_EXPIRED, 401, 'Session expiree', correlation.last),
            );
          }

          return next(
            request.clone({
              setHeaders: { Authorization: `Bearer ${refreshedToken}` },
              context: request.context.set(AUTH_RETRIED, true),
            }),
          );
        }),
        catchError(() => {
          auth.expireSession();
          return throwError(() =>
            buildProblem(ERROR_CODES.SESSION_EXPIRED, 401, 'Session expiree', correlation.last),
          );
        }),
      );
    }),
  );
};
