import { PLATFORM_ID, inject, Injectable } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly swUpdate = inject(SwUpdate, { optional: true });

  constructor() {
    if (!isPlatformBrowser(this.platformId) || !this.swUpdate?.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        void this.swUpdate
          ?.activateUpdate()
          .then(() => window.location.reload())
          .catch(() => undefined);
      }
    });

    void this.swUpdate.checkForUpdate().catch(() => undefined);
  }
}
