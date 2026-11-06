import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CourrierSelectComponent } from './courrier-select.component';
import { CourriersGateway } from '../../services/courriers/courriers.gateway';

const option = {
  id: 'cr1',
  numero: 'C-001',
  objet: 'Objet',
  sens: 'ENTRANT' as const,
  typeCourrier: 'COURRIER' as const,
  date: '2026-11-05T00:00:00Z',
};

function setup() {
  const gateway = { lookup: vi.fn(() => of([option])) };
  TestBed.configureTestingModule({
    imports: [CourrierSelectComponent],
    providers: [{ provide: CourriersGateway, useValue: gateway }],
  });
  return { fixture: TestBed.createComponent(CourrierSelectComponent), gateway };
}

describe('CourrierSelectComponent', () => {
  afterEach(() => vi.useRealTimers());

  it('recherche avec debounce et selectionne une option', () => {
    vi.useFakeTimers();
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    const input = document.createElement('input');
    input.value = 'C-0';
    fixture.componentInstance.onInput({ target: input } as unknown as Event);
    vi.advanceTimersByTime(300);
    expect(gateway.lookup).toHaveBeenCalledWith('C-0');
    expect(fixture.componentInstance.results()).toHaveLength(1);
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    fixture.componentInstance.choose(option);
    expect(change).toHaveBeenCalledWith('cr1');
    expect(fixture.componentInstance.selected()?.numero).toBe('C-001');
  });

  it('efface la selection et gere le clavier', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const change = vi.fn();
    const touched = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    fixture.componentInstance.registerOnTouched(touched);
    const input = document.createElement('input');
    input.value = 'C';
    fixture.componentInstance.onInput({ target: input } as unknown as Event);
    expect(touched).toHaveBeenCalled();
    fixture.componentInstance.writeValue('cr1');
    expect(fixture.componentInstance.selected()?.numero).toBe('cr1');
    fixture.componentInstance.clear();
    expect(change).toHaveBeenCalledWith(null);
    expect(fixture.componentInstance.activeOptionId()).toBeNull();
    fixture.componentInstance.close();
    expect(fixture.componentInstance.open()).toBe(false);
  });
});

describe('CourrierSelectComponent keyboard', () => {
  it('navigue au clavier, choisit et ferme', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const change = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    fixture.componentInstance.results.set([option]);
    fixture.componentInstance.activeIndex.set(0);
    const down = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    fixture.componentInstance.onKeydown(down);
    const up = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    fixture.componentInstance.onKeydown(up);
    const enter = new KeyboardEvent('keydown', { key: 'Enter' });
    fixture.componentInstance.onKeydown(enter);
    expect(change).toHaveBeenCalledWith('cr1');
    const escape = new KeyboardEvent('keydown', { key: 'Escape' });
    fixture.componentInstance.onKeydown(escape);
    fixture.componentInstance.setDisabledState(true);
    expect(fixture.componentInstance.disabled()).toBe(true);
    fixture.componentInstance.writeValue(null);
    expect(fixture.componentInstance.selected()).toBeNull();
  });
});

describe('CourrierSelectComponent pointer', () => {
  it('ferme au blur et hors du composant', () => {
    vi.useFakeTimers();
    const { fixture } = setup();
    fixture.detectChanges();
    fixture.componentInstance.open.set(true);
    fixture.componentInstance.onBlur();
    vi.runAllTimers();
    expect(fixture.componentInstance.open()).toBe(false);
    fixture.componentInstance.open.set(true);
    fixture.componentInstance.onDocumentClick({ target: document.body } as unknown as MouseEvent);
    expect(fixture.componentInstance.open()).toBe(false);
    vi.useRealTimers();
  });
});

describe('CourrierSelectComponent identifiers', () => {
  it('expose les identifiants ARIA', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    expect(fixture.componentInstance.listboxId()).toBe('courrier-listbox-courrier');
    expect(fixture.componentInstance.optionId(option)).toBe('courrier-option-cr1');
    expect(fixture.componentInstance.activeOptionId()).toBeNull();
    fixture.componentInstance.results.set([option]);
    fixture.componentInstance.activeIndex.set(0);
    expect(fixture.componentInstance.activeOptionId()).toBe('courrier-option-cr1');
  });
});
