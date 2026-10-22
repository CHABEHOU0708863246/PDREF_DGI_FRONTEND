import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

describe('contrastes WCAG des tokens', () => {
  it.each([
    ['texte clair sur fond', '#0F172A', '#F6F8FC'],
    ['texte attenue clair', '#475569', '#F6F8FC'],
    ['texte sur primaire', '#FFFFFF', '#0B3D91'],
    ['texte sur secondaire', '#0B1F4D', '#C9A227'],
    ['succes', '#14642D', '#E6F4EA'],
    ['alerte', '#7A4A00', '#FFF4E0'],
    ['erreur', '#8C1D18', '#FDECEA'],
    ['info', '#084C91', '#E7F1FB'],
    ['texte sombre sur fond sombre', '#E6EDF8', '#0B1220'],
    ['texte attenue sombre', '#A9B7CC', '#0B1220'],
    ['primaire sombre', '#071426', '#6C9BFF'],
  ])('%s >= 4.5:1', (_label, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
