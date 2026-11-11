import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { UrlTree } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import type { Observable } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AdhesionGateway } from '../services/adhesions/adhesion.gateway';
import { adhesionFeatureGuard } from './adhesion-feature.guard';

function setup(active: boolean) {
  const gateway = {
    activation: vi.fn(() => (active ? of(void 0) : throwError(() => new Error('404')))),
  };
  const tree = {} as UrlTree;
  const router = { parseUrl: vi.fn(() => tree) };
  TestBed.configureTestingModule({
    providers: [
      { provide: AdhesionGateway, useValue: gateway },
      { provide: Router, useValue: router },
    ],
  });
  return { router, tree };
}

describe('adhesionFeatureGuard', () => {
  it('laisse passer quand l interrupteur est actif', async () => {
    setup(true);
    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(
        adhesionFeatureGuard({} as never, {} as never) as Observable<boolean | UrlTree>,
      ),
    );
    expect(result).toBe(true);
  });

  it('redirige vers 404 quand l interrupteur est desactive', async () => {
    const { router, tree } = setup(false);
    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(
        adhesionFeatureGuard({} as never, {} as never) as Observable<boolean | UrlTree>,
      ),
    );
    expect(router.parseUrl).toHaveBeenCalledWith('/introuvable');
    expect(result).toBe(tree);
  });
});
