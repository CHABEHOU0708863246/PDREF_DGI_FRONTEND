import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { BarChartComponent } from './bar-chart.component';

describe('BarChartComponent', () => {
  it('renders bars, accessible data table, click and keyboard', () => {
    TestBed.configureTestingModule({ imports: [BarChartComponent] });
    const fixture = TestBed.createComponent(BarChartComponent);
    fixture.componentRef.setInput('title', 'Alertes par semaine');
    fixture.componentRef.setInput('unit', 'alertes');
    fixture.componentRef.setInput('series', [
      { label: '2026-S44', value: 3 },
      { label: '2026-S45', value: 6 },
    ]);
    fixture.detectChanges();
    const events: string[] = [];
    fixture.componentInstance.barClick.subscribe((value) => events.push(value));
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('svg g.bar-chart__bar')).toHaveLength(2);
    expect(element.querySelector('.bar-chart__visual')?.getAttribute('role')).toBe('img');
    expect(element.querySelector('.bar-chart__visual')?.getAttribute('aria-label')).toContain(
      '2026-S45 6',
    );
    expect(element.querySelectorAll('table tbody tr')).toHaveLength(2);
    (element.querySelector('svg g.bar-chart__bar') as SVGGElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    (element.querySelectorAll('.pd-visually-hidden button')[1] as HTMLButtonElement).click();
    expect(events).toEqual(['2026-S44', '2026-S45']);
  });

  it('shows the empty state and prevents space scrolling', () => {
    TestBed.configureTestingModule({ imports: [BarChartComponent] });
    const fixture = TestBed.createComponent(BarChartComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aucune alerte');

    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    fixture.componentInstance.onSpace(event, '2026-S45');
    expect(event.defaultPrevented).toBe(true);
  });
});
