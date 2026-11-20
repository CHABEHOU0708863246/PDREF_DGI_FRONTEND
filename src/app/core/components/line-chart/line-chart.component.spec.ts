import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { LineChartComponent } from './line-chart.component';

describe('LineChartComponent', () => {
  it('prepare les points, la courbe et les axes', () => {
    TestBed.configureTestingModule({ imports: [LineChartComponent] });
    const fixture = TestBed.createComponent(LineChartComponent);
    fixture.componentRef.setInput('series', [
      { label: 'Juin', value: 2 },
      { label: 'Juil.', value: 4 },
      { label: 'Aout', value: 3 },
    ]);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.maxValue()).toBe(4);
    expect(component.points()).toHaveLength(3);
    expect(component.linePath()).toContain('C');
    expect(component.areaPath().endsWith('Z')).toBe(true);
    expect(component.gridLines()).toHaveLength(3);
    expect(component.shortLabel('Septembre')).toBe('Septembre');
    expect(component.shortLabel('Septembre 2026')).toBe('Septembr...');
  });

  it('ne produit rien sans donnee', () => {
    TestBed.configureTestingModule({ imports: [LineChartComponent] });
    const fixture = TestBed.createComponent(LineChartComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.points()).toHaveLength(0);
    expect(fixture.componentInstance.linePath()).toBe('');
  });
});
