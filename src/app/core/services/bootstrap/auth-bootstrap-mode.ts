import { InjectionToken } from '@angular/core';

export type AuthBootstrapMode = 'http' | 'demo';

export const AUTH_BOOTSTRAP_MODE = new InjectionToken<AuthBootstrapMode>('AUTH_BOOTSTRAP_MODE');
