import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AdhesionGateway } from '../services/adhesions/adhesion.gateway';
import { isLighthouseEnabled } from '../utils/lighthouse';

export const adhesionFeatureGuard: CanActivateFn = () => {
  if (isLighthouseEnabled()) {
    return true;
  }

  const gateway = inject(AdhesionGateway);
  const router = inject(Router);
  return gateway.activation().pipe(
    map(() => true),
    catchError(() => of(router.parseUrl('/introuvable'))),
  );
};
