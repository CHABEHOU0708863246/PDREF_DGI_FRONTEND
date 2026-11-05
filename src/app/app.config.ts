import type { ApplicationConfig } from '@angular/core';
import {
  ErrorHandler,
  LOCALE_ID,
  inject,
  isDevMode,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { AUTH_GATEWAY } from './core/services/auth/auth.gateway';
import { DemoAuthGateway } from './core/services/auth/demo-auth.gateway';
import { HttpAuthGateway } from './core/services/auth/http-auth.gateway';
import { AppBootstrapService } from './core/services/bootstrap/app-bootstrap.service';
import { AUTH_BOOTSTRAP_MODE } from './core/services/bootstrap/auth-bootstrap-mode';
import { GlobalErrorHandler } from './core/services/errors/global-error.handler';
import {
  CONTRIBUABLE_LOOKUP,
  HttpContribuableLookup,
} from './core/services/lookup/contribuable-lookup';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { correlationInterceptor } from './core/interceptors/correlation.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { environment } from '../environments/environment';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideClientHydration(),
    provideHttpClient(
      withFetch(),
      withInterceptors([correlationInterceptor, errorInterceptor, authInterceptor]),
    ),
    provideAppInitializer(() => inject(AppBootstrapService).initialize()),
    { provide: AUTH_BOOTSTRAP_MODE, useValue: environment.authMode },
    { provide: LOCALE_ID, useValue: 'fr' },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    {
      provide: AUTH_GATEWAY,
      useFactory: () =>
        environment.authMode === 'demo' ? inject(DemoAuthGateway) : inject(HttpAuthGateway),
    },
    {
      provide: CONTRIBUABLE_LOOKUP,
      useClass: HttpContribuableLookup,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
