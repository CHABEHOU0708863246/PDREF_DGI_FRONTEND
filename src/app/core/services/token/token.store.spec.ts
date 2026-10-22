import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { TokenStore } from './token.store';

const session = {
  accessToken: 'access-demo',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  user: {
    id: 'u1',
    displayName: 'Demo',
    roles: [],
    permissions: [],
  },
};

describe('TokenStore', () => {
  it('garde l access token en memoire uniquement', () => {
    TestBed.configureTestingModule({ providers: [TokenStore] });
    const store = TestBed.inject(TokenStore);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    store.set(session);

    expect(store.getAccessToken()).toBe('access-demo');
    expect(store.hasValidAccessToken()).toBe(true);
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it('refuse un token expire', () => {
    TestBed.configureTestingModule({ providers: [TokenStore] });
    const store = TestBed.inject(TokenStore);
    store.set({ ...session, expiresAt: new Date(Date.now() - 1_000).toISOString() });
    expect(store.hasValidAccessToken()).toBe(false);
  });

  it('se vide', () => {
    TestBed.configureTestingModule({ providers: [TokenStore] });
    const store = TestBed.inject(TokenStore);
    store.set(session);
    store.clear();
    expect(store.getAccessToken()).toBeNull();
    expect(store.hasValidAccessToken()).toBe(false);
  });
});
