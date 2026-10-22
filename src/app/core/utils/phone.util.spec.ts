import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PHONE_ISO,
  findPhoneCountry,
  formatReadablePhone,
  normalizeNationalPhone,
  splitE164,
  toE164,
} from './phone.util';

describe('phone.util', () => {
  it('convertit un numero ivoirien en E.164', () => {
    expect(toE164('07 00 00 00 00', 'CI')).toEqual({ ok: true, e164: '+2250700000000' });
  });

  it('refuse un numero ivoirien trop court', () => {
    const result = toE164('070000000', 'CI');
    expect(result.ok).toBe(false);
  });

  it('normalise et separe', () => {
    expect(normalizeNationalPhone('07-00 00')).toBe('070000');
    expect(splitE164('+2250700000000')).toEqual({ iso: 'CI', national: '0700000000' });
  });

  it('formate un numero lisible', () => {
    expect(formatReadablePhone('+2250700000000')).toBe('+225 07 00 00 00 00');
    expect(formatReadablePhone(null)).toBe('');
  });

  it('expose le pays par defaut', () => {
    expect(DEFAULT_PHONE_ISO).toBe('CI');
    expect(findPhoneCountry('CI')?.dialCode).toBe('+225');
    expect(findPhoneCountry('XX')).toBeUndefined();
  });
});
