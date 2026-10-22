import { describe, expect, it } from 'vitest';
import { AbidjanDatePipe } from './abidjan-date.pipe';
import { FcfaPipe } from './fcfa.pipe';

describe('pipes', () => {
  it('fcfa formate sans decimales', () => {
    const pipe = new FcfaPipe();
    expect(pipe.transform('1234.5')).toContain('FCFA');
    expect(pipe.transform(null)).toBe('—');
  });

  it('abidjanDate formate en Africa/Abidjan', () => {
    const pipe = new AbidjanDatePipe();
    const value = pipe.transform('2026-10-21T10:00:00Z');
    expect(value).not.toBe('—');
    expect(value).toContain('2026');
  });

  it('abidjanDate refuse les valeurs invalides', () => {
    const pipe = new AbidjanDatePipe();
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform('pas une date')).toBe('—');
  });
});
