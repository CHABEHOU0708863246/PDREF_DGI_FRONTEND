export interface PhoneCountry {
  iso: string;
  dialCode: string;
  name: string;
}

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  { iso: 'CI', dialCode: '+225', name: "Cote d'Ivoire" },
  { iso: 'BF', dialCode: '+226', name: 'Burkina Faso' },
  { iso: 'ML', dialCode: '+223', name: 'Mali' },
  { iso: 'SN', dialCode: '+221', name: 'Senegal' },
  { iso: 'GH', dialCode: '+233', name: 'Ghana' },
  { iso: 'NG', dialCode: '+234', name: 'Nigeria' },
  { iso: 'FR', dialCode: '+33', name: 'France' },
];

export const DEFAULT_PHONE_ISO = 'CI';

export function findPhoneCountry(iso: string): PhoneCountry | undefined {
  return PHONE_COUNTRIES.find((country) => country.iso === iso);
}

export function normalizeNationalPhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function toE164(
  national: string,
  iso: string,
): { ok: true; e164: string } | { ok: false; reason: string } {
  const country = findPhoneCountry(iso);
  if (!country) {
    return { ok: false, reason: 'Pays inconnu.' };
  }

  const digits = normalizeNationalPhone(national);
  if (digits.length === 0) {
    return { ok: false, reason: 'Numero obligatoire.' };
  }

  if (iso === 'CI' && digits.length !== 10) {
    return { ok: false, reason: 'Le numero ivoirien doit contenir 10 chiffres.' };
  }

  if (digits.length < 6 || digits.length > 15) {
    return { ok: false, reason: 'Numero invalide.' };
  }

  return { ok: true, e164: `${country.dialCode}${digits}` };
}

export function splitE164(value: string): { iso: string; national: string } {
  const sorted = [...PHONE_COUNTRIES].sort(
    (left, right) => right.dialCode.length - left.dialCode.length,
  );
  const country = sorted.find((item) => value.startsWith(item.dialCode));

  if (!country) {
    return { iso: DEFAULT_PHONE_ISO, national: normalizeNationalPhone(value) };
  }

  return {
    iso: country.iso,
    national: value.slice(country.dialCode.length),
  };
}

export function formatReadablePhone(e164: string | null): string {
  if (!e164) {
    return '';
  }

  const { iso, national } = splitE164(e164);
  const country = findPhoneCountry(iso);
  const grouped = national.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  return `${country?.dialCode ?? ''} ${grouped}`.trim();
}
