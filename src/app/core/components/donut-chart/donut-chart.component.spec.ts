import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DonutChartComponent } from './donut-chart.component';

describe('DonutChartComponent', () => {
  it('calcule le total et les segments non nuls', () => {
    TestBed.configureTestingModule({ imports: [DonutChartComponent] });
    const fixture = TestBed.createComponent(DonutChartComponent);
    fixture.componentRef.setInput('series', [
      { label: 'NORMAL', value: 8 },
      { label: 'SMT', value: 3 },
      { label: 'RSI', value: 0 },
    ]);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.total()).toBe(11);
    expect(component.segments()).toHaveLength(2);
    expect(component.segments()[0].percent).toBeCloseTo(72.7, 1);
    expect(component.formatPercent(50)).toBe('50,0 %');
  });

  it('affiche un etat vide sans donnee', () => {
    TestBed.configureTestingModule({ imports: [DonutChartComponent] });
    const fixture = TestBed.createComponent(DonutChartComponent);
    fixture.componentRef.setInput('series', []);
    fixture.detectChanges();

    expect(fixture.componentInstance.total()).toBe(0);
    expect(fixture.componentInstance.segments()).toHaveLength(0);
  });
});
