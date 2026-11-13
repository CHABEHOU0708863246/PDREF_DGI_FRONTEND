import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppUpdateService } from './app-update.service';

describe('AppUpdateService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('recharge la page quand une nouvelle version est prete', async () => {
    const events = new Subject<{ type: string }>();
    const sw = {
      isEnabled: true,
      versionUpdates: events.asObservable(),
      activateUpdate: vi.fn(() => Promise.resolve(true)),
      checkForUpdate: vi.fn(() => Promise.resolve(false)),
    };
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    TestBed.configureTestingModule({
      providers: [{ provide: SwUpdate, useValue: sw }],
    });

    TestBed.runInInjectionContext(() => new AppUpdateService());
    events.next({ type: 'VERSION_READY' });
    await Promise.resolve();
    await Promise.resolve();

    expect(sw.checkForUpdate).toHaveBeenCalled();
    expect(sw.activateUpdate).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });
});
