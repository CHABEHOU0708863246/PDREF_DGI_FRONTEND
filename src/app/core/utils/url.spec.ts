import { describe, expect, it } from 'vitest';
import { isAuthApiUrl, isPublicApiUrl, sanitizeReturnUrl } from './url';

describe('url', () => {
  it('identifie les routes publiques et d authentification', () => {
    expect(isPublicApiUrl('/api/v1/auth/login')).toBe(true);
    expect(isPublicApiUrl('http://localhost:5080/api/v1/public/suivi')).toBe(true);
    expect(isPublicApiUrl('/api/v1/demandes')).toBe(false);
    expect(isAuthApiUrl('/api/v1/auth/refresh')).toBe(true);
  });

  it('ne conserve qu un chemin interne sans query', () => {
    expect(sanitizeReturnUrl('/dashboard?ncc=123')).toBe('/dashboard');
    expect(sanitizeReturnUrl('https://evil.example/path')).toBe('/path');
    expect(sanitizeReturnUrl(null)).toBe('/dashboard');
  });
});
