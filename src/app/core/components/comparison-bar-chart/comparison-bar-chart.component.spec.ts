import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ComparisonBarChartComponent } from './comparison-bar-chart.component';

describe('ComparisonBarChartComponent', () => {
  it('prepare une barre par periode avec les deux series', () => {
    TestBed.configureTestingModule({ imports: [ComparisonBarChartComponent] });
    const fixture = TestBed.createComponent(ComparisonBarChartComponent);
    fixture.componentRef.setInput('series', [
      { label: 'Janv.', courant: 5, precedent: 2 },
      { label: 'Fevr.', courant: 3, precedent: 4 },
    ]);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.maxValue()).toBe(5);
    expect(component.bars()).toHaveLength(2);
    expect(component.bars()[0].courantHauteur).toBeGreaterThan(
      component.bars()[0].precedentHauteur,
    );
    expect(component.shortLabel('Un libelle tres long')).toBe('Un libelle...');
  });

  it('ne produit aucune barre sans donnee', () => {
    TestBed.configureTestingModule({ imports: [ComparisonBarChartComponent] });
    const fixture = TestBed.createComponent(ComparisonBarChartComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.bars()).toHaveLength(0);
  });
});
