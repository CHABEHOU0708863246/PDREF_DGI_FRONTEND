import { describe, expect, it } from 'vitest';
import { formatFcfa } from './format-fcfa';

const NBSP = '\u00A0';
const NNBSP = '\u202F';

describe('formatFcfa', () => {
  it('groupe les milliers sans decimales', () => {
    expect(formatFcfa('1234567.5')).toBe(`1${NNBSP}234${NNBSP}568${NBSP}FCFA`);
  });

  it('gere les negatifs', () => {
    expect(formatFcfa('-45000')).toBe(`-45${NNBSP}000${NBSP}FCFA`);
  });

  it('arrondit au superieur a partir de 5', () => {
    expect(formatFcfa('999.5')).toBe(`1${NNBSP}000${NBSP}FCFA`);
    expect(formatFcfa('999.4')).toBe(`999${NBSP}FCFA`);
  });

  it('conserve la precision des grands nombres', () => {
    expect(formatFcfa('12345678901234567890.4')).toBe(
      `12${NNBSP}345${NNBSP}678${NNBSP}901${NNBSP}234${NNBSP}567${NNBSP}890${NBSP}FCFA`,
    );
  });

  it('refuse les valeurs invalides', () => {
    expect(formatFcfa(null)).toBe('—');
    expect(formatFcfa('')).toBe('—');
    expect(formatFcfa('abc')).toBe('—');
    expect(formatFcfa('1,5')).toBe('—');
  });

  it('peut omettre la devise', () => {
    expect(formatFcfa('1200', false)).toBe(`1${NNBSP}200`);
  });
});
