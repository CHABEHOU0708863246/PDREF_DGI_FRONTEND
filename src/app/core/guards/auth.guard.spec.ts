import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth/auth.service';
import { authGuard, loginGuard } from './auth.guard';

function setup(authenticated: boolean, platform: 'browser' | 'server' = 'browser') {
  const createUrlTree = vi.fn((commands: unknown, extras: unknown) => ({ commands, extras }));
  const auth = { isAuthenticated: () => authenticated, sessionExpired: () => false };

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: auth },
      { provide: Router, useValue: { createUrlTree, navigate: vi.fn() } },
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });

  return { createUrlTree };
}

const route = {} as ActivatedRouteSnapshot;
const state = { url: '/dashboard?ncc=123' } as RouterStateSnapshot;

describe('authGuard', () => {
  it('laisse passer une session valide', async () => {
    setup(true);
    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(true);
  });

  it('redirige avec un returnUrl sans query PII', async () => {
    const { createUrlTree } = setup(false);
    await TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/dashboard' },
    });
  });

  it('laisse passer le SSR', async () => {
    setup(false, 'server');
    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(true);
  });
});

describe('loginGuard', () => {
  it('redirige un utilisateur connecte vers le dashboard', async () => {
    const { createUrlTree } = setup(true);
    await TestBed.runInInjectionContext(() => loginGuard(route, state));
    expect(createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
