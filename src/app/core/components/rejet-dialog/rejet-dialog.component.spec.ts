import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { RejetDialogComponent } from './rejet-dialog.component';

describe('RejetDialogComponent', () => {
  it('exige un motif et un commentaire puis confirme', () => {
    TestBed.configureTestingModule({ imports: [RejetDialogComponent] });
    const fixture = TestBed.createComponent(RejetDialogComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('motifs', [
      {
        code: 'PIECE_JUSTIFICATIVE_MANQUANTE',
        libelle: 'Piece manquante',
        legacy: false,
        selectionnable: true,
      },
    ]);
    fixture.detectChanges();

    const values: string[] = [];
    component.confirmed.subscribe((value) => values.push(value.motifCode));
    component.confirm();
    expect(component.invalid()).toBe(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('au moins 10');
    expect(values).toEqual([]);

    component.motifCode.set('PIECE_JUSTIFICATIVE_MANQUANTE');
    component.commentaire.set('Commentaire de rejet suffisant.');
    component.confirm();
    expect(values).toEqual(['PIECE_JUSTIFICATIVE_MANQUANTE']);
    expect(component.invalid()).toBe(false);
    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Rejet en cours');

    let cancelled = 0;
    component.cancelled.subscribe(() => (cancelled += 1));
    component.cancel();
    expect(cancelled).toBe(1);

    const cancelEvent = { preventDefault: vi.fn() } as unknown as Event;
    component.onCancel(cancelEvent);
    expect(cancelEvent.preventDefault).toHaveBeenCalled();
    expect(cancelled).toBe(2);

    const backdropTarget = {};
    component.onBackdrop({
      target: backdropTarget,
      currentTarget: backdropTarget,
    } as unknown as MouseEvent);
    expect(cancelled).toBe(3);
  });
});
