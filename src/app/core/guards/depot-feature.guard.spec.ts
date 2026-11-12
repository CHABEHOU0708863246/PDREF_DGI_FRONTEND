import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { UrlTree } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import type { Observable } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { DepotGateway } from '../services/depots/depot.gateway';
import { depotFeatureGuard } from './depot-feature.guard';

function setup(active: boolean) {
  const gateway = {
    activation: vi.fn(() => (active ? of(void 0) : throwError(() => new Error('404')))),
  };
  const tree = {} as UrlTree;
  const router = { parseUrl: vi.fn(() => tree) };
  TestBed.configureTestingModule({
    providers: [
      { provide: DepotGateway, useValue: gateway },
      { provide: Router, useValue: router },
    ],
  });
  return { router, tree };
}

describe('depotFeatureGuard', () => {
  it('laisse passer quand les deux interrupteurs sont actifs', async () => {
    setup(true);
    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(depotFeatureGuard({} as never, {} as never) as Observable<boolean | UrlTree>),
    );
    expect(result).toBe(true);
  });

  it('redirige vers 404 quand le depot est desactive', async () => {
    const { router, tree } = setup(false);
    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(depotFeatureGuard({} as never, {} as never) as Observable<boolean | UrlTree>),
    );
    expect(router.parseUrl).toHaveBeenCalledWith('/introuvable');
    expect(result).toBe(tree);
  });
});
