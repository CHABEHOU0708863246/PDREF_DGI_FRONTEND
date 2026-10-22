import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialogService } from '../services/confirm/confirm-dialog.service';
import { unsavedChangesGuard } from './unsaved-changes.guard';

function setup(result: boolean) {
  const confirm = vi.fn().mockResolvedValue(result);
  TestBed.configureTestingModule({
    providers: [{ provide: ConfirmDialogService, useValue: { confirm } }],
  });
  return { confirm };
}

describe('unsavedChangesGuard', () => {
  it('laisse passer sans modification', () => {
    setup(true);
    const component = { hasUnsavedChanges: () => false };
    expect(
      TestBed.runInInjectionContext(() =>
        unsavedChangesGuard(component, {} as never, {} as never, {} as never),
      ),
    ).toBe(true);
  });

  it('demande confirmation si des modifications existent', async () => {
    const { confirm } = setup(false);
    const component = { hasUnsavedChanges: () => true };
    const result = TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(component, {} as never, {} as never, {} as never),
    );

    expect(confirm).toHaveBeenCalledOnce();
    await expect(result).resolves.toBe(false);
  });
});
