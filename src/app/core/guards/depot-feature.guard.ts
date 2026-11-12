import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { DepotGateway } from '../services/depots/depot.gateway';
import { isLighthouseEnabled } from '../utils/lighthouse';

export const depotFeatureGuard: CanActivateFn = () => {
  if (isLighthouseEnabled()) {
    return true;
  }

  const gateway = inject(DepotGateway);
  const router = inject(Router);
  return gateway.activation().pipe(
    map(() => true),
    catchError(() => of(router.parseUrl('/introuvable'))),
  );
};
