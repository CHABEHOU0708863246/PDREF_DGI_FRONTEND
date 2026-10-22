import { Injectable, computed, signal } from '@angular/core';
import type { AuthTokens } from '../../models/auth/auth.model';

const CLOCK_SKEW_MS = 5_000;

/**
 * L'access token vit uniquement en memoire. Aucun stockage navigateur.
 * Le refresh token est un cookie HttpOnly gere par le navigateur.
 */
@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly token = signal<string | null>(null);
  private readonly expiry = signal<number | null>(null);

  readonly hasToken = computed(() => this.token() !== null);

  set(tokens: AuthTokens): void {
    this.token.set(tokens.accessToken);
    const expiresAt = Date.parse(tokens.expiresAt);
    this.expiry.set(Number.isNaN(expiresAt) ? null : expiresAt);
  }

  clear(): void {
    this.token.set(null);
    this.expiry.set(null);
  }

  getAccessToken(): string | null {
    return this.token();
  }

  hasValidAccessToken(): boolean {
    const token = this.token();
    const expiry = this.expiry();
    if (!token || expiry === null) {
      return false;
    }
    return expiry > Date.now() + CLOCK_SKEW_MS;
  }
}
