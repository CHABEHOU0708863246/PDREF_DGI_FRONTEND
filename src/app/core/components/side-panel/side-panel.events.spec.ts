import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialogService } from '../../services/confirm/confirm-dialog.service';
import { SidePanelComponent } from './side-panel.component';

describe('SidePanelComponent events', () => {
  function setup() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SidePanelComponent],
      providers: [{ provide: ConfirmDialogService, useValue: { confirm: vi.fn() } }],
    });
    const fixture = TestBed.createComponent(SidePanelComponent);
    fixture.componentRef.setInput('title', 'Panneau');
    fixture.detectChanges();
    return fixture;
  }

  it('annule evenement et ferme sur Echap', () => {
    const fixture = setup();
    const spy = vi.spyOn(fixture.componentInstance, 'requestClose').mockResolvedValue();
    const event = new Event('cancel', { cancelable: true });
    fixture.componentInstance.onCancel(event);
    expect(event.defaultPrevented).toBe(true);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('ferme au clic sur le fond uniquement', () => {
    const fixture = setup();
    const spy = vi.spyOn(fixture.componentInstance, 'requestClose').mockResolvedValue();
    const backdrop = { target: 'dialog', currentTarget: 'dialog' } as unknown as MouseEvent;
    fixture.componentInstance.onBackdrop(backdrop);
    expect(spy).toHaveBeenCalledOnce();
    const child = { target: 'button', currentTarget: 'dialog' } as unknown as MouseEvent;
    fixture.componentInstance.onBackdrop(child);
    expect(spy).toHaveBeenCalledOnce();
  });
});
