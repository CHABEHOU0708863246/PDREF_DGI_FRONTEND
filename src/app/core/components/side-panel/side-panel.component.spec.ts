import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialogService } from '../../services/confirm/confirm-dialog.service';
import { SidePanelComponent } from './side-panel.component';

describe('SidePanelComponent', () => {
  function setup(dirty = false) {
    TestBed.resetTestingModule();
    const confirm = { confirm: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      imports: [SidePanelComponent],
      providers: [{ provide: ConfirmDialogService, useValue: confirm }],
    });
    const fixture = TestBed.createComponent(SidePanelComponent);
    fixture.componentRef.setInput('title', 'Panneau de test');
    fixture.componentRef.setInput('dirty', dirty);
    fixture.detectChanges();
    return { fixture, confirm };
  }

  it('expose un dialogue modal nomme', () => {
    const { fixture } = setup();
    const dialog = fixture.nativeElement.querySelector('dialog');

    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toContain('side-panel-title');
  });

  it('ferme directement sans modification', async () => {
    const { fixture, confirm } = setup(false);
    const closed = vi.fn();
    fixture.componentInstance.closeRequested.subscribe(closed);

    await fixture.componentInstance.requestClose();

    expect(confirm.confirm).not.toHaveBeenCalled();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('demande confirmation si le formulaire est modifie', async () => {
    const { fixture, confirm } = setup(true);
    const closed = vi.fn();
    fixture.componentInstance.closeRequested.subscribe(closed);

    await fixture.componentInstance.requestClose();

    expect(confirm.confirm).toHaveBeenCalledOnce();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('reste ouvert si la confirmation est refusee', async () => {
    const { fixture, confirm } = setup(true);
    confirm.confirm.mockResolvedValue(false);
    const closed = vi.fn();
    fixture.componentInstance.closeRequested.subscribe(closed);

    await fixture.componentInstance.requestClose();

    expect(closed).not.toHaveBeenCalled();
  });
});
