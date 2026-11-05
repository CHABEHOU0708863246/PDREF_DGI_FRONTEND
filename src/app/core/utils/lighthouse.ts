import { environment } from '../../../environments/environment';

export function isLighthouseEnabled(): boolean {
  if (environment.production || typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).get('lighthouse') === '1';
}
