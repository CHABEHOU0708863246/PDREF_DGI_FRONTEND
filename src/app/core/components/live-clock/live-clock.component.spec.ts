import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveClockComponent } from './live-clock.component';

describe('LiveClockComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-13T14:32:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('affiche la date fr-FR en fuseau Abidjan et ne parle pas aux lecteurs d ecran', () => {
    TestBed.configureTestingModule({ imports: [LiveClockComponent] });
    const fixture = TestBed.createComponent(LiveClockComponent);
    fixture.componentRef.setInput('lastRefreshAt', Date.now());
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('vendredi 13 novembre 2026');
    expect(text).toContain('14:32');
    expect(fixture.nativeElement.querySelector('time')?.getAttribute('aria-live')).toBe('off');
  });

  it('fait avancer le compteur chaque seconde', () => {
    TestBed.configureTestingModule({ imports: [LiveClockComponent] });
    const fixture = TestBed.createComponent(LiveClockComponent);
    fixture.componentRef.setInput('lastRefreshAt', Date.now());
    fixture.detectChanges();
    vi.advanceTimersByTime(25_000);
    fixture.detectChanges();

    expect(fixture.componentInstance.elapsedSeconds()).toBe(25);
    expect(fixture.nativeElement.textContent).toContain('25 s');
  });
});
