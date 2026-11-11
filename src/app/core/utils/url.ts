const PUBLIC_API_PREFIXES = [
  '/api/v1/public/',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/validate-reset-token',
  '/api/v1/auth/mfa/',
];

export function apiPath(url: string): string {
  try {
    return new URL(url, 'http://pdref.local').pathname;
  } catch {
    return url;
  }
}

export function isPublicApiUrl(url: string): boolean {
  const path = apiPath(url);
  return PUBLIC_API_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function isAuthApiUrl(url: string): boolean {
  return apiPath(url).startsWith('/api/v1/auth/');
}

/** Ne conserve qu'un chemin interne : jamais de query string (PII) ni d'URL externe. */
export function sanitizeReturnUrl(url: string | null | undefined): string {
  if (!url) {
    return '/dashboard';
  }

  try {
    const parsed = new URL(url, 'http://pdref.local');
    if (!parsed.pathname.startsWith('/') || parsed.pathname.startsWith('//')) {
      return '/dashboard';
    }
    return parsed.pathname;
  } catch {
    return '/dashboard';
  }
}
