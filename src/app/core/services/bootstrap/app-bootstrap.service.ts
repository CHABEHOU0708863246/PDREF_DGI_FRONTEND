import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom, catchError, of, timeout } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AUTH_BOOTSTRAP_MODE } from './auth-bootstrap-mode';
import { isLighthouseEnabled } from '../../utils/lighthouse';

/**
 * Bootstrap unique : refresh cookie -> /me -> permissions -> ready.
 * Aucun endpoint metier n'est appele avant la fin de cette chaine.
 */
@Injectable({ providedIn: 'root' })
export class AppBootstrapService {
  private readonly auth = inject(AuthService);
  private readonly permissions = inject(PermissionsService);
  private readonly mode = inject(AUTH_BOOTSTRAP_MODE);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  async initialize(): Promise<void> {
    if (
      typeof window === 'undefined' ||
      typeof document === 'undefined' ||
      !this.isBrowser ||
      this.mode === 'demo' ||
      isPublicPage()
    ) {
      this.permissions.markReady();
      return;
    }

    if (isLighthouseEnabled()) {
      this.auth.applySession(
        { accessToken: 'lighthouse-demo-token', expiresAt: '2035-01-01T00:00:00Z' },
        {
          id: 'lighthouse',
          login: 'lighthouse',
          displayName: 'Lighthouse demo',
          roles: ['SD_GUDEF', 'CHEF_CTF'],
          permissions: [
            'Contribuables_Read',
            'Contribuables_ReadPii',
            'Contribuables_Create',
            'Contribuables_Update',
            'Contribuables_Archive',
            'Contribuables_Export',
            'Contribuables_Sync',
            'Courriers_Read',
            'Courriers_Create',
            'Courriers_Update',
            'Courriers_ReadInternal',
            'Courriers_Signer',
            'Courriers_Deposer_EImpots',
            'Workflows_Read',
            'Workflows_Manage',
            'Workflows_FeatureFlag',
            'Demandes_Read',
            'Suivis_Read',
            'Avis_Lire',
            'Avis_Emettre',
            'Suivis_Decide',
            'Suivis_Corriger',
            'Suivis_Transmettre',
            'Ctf_Read',
            'Ctf_Activer',
            'Ctf_Retour',
            'Rejets_Read',
            'Rejets_Create',
            'Rejets_Reprendre',
            'Rejets_Abandonner',
            'Imports_Read',
            'Imports_Execute',
            'Alertes_Read',
            'Dashboard_Read',
            'Dashboard_ReadDg',
          ],
          mustChangePassword: false,
        },
      );
      this.permissions.markReady();
      return;
    }

    try {
      await firstValueFrom(
        this.auth.restoreSession().pipe(
          timeout(5_000),
          catchError(() => of(null)),
        ),
      );
    } finally {
      this.permissions.markReady();
    }
  }
}

function isPublicPage(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const path = window.location.pathname;
  return (
    path === '/design-system-demo' ||
    path.startsWith('/auth') ||
    path.startsWith('/portail-public') ||
    path === '/error' ||
    path === '/unauthorized'
  );
}
