const DECIMAL_PATTERN = /^-?\d+(?:\.\d+)?$/;

/** Formate un montant FCFA sans decimales, sans passer par un flottant. */
export function formatFcfa(value: string | number | null | undefined, withCurrency = true): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const raw = typeof value === 'number' ? String(value) : value.trim();
  if (!DECIMAL_PATTERN.test(raw)) {
    return '—';
  }

  const negative = raw.startsWith('-');
  const unsigned = negative ? raw.slice(1) : raw;
  const [integerPart, decimalPart = ''] = unsigned.split('.');
  let digits = integerPart.replace(/^0+(?=\d)/, '');
  if (digits.length === 0) {
    digits = '0';
  }

  if (decimalPart.length > 0 && decimalPart.charCodeAt(0) >= 53) {
    digits = addOne(digits);
  }

  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  const sign = negative && digits !== '0' ? '-' : '';
  return `${sign}${grouped}${withCurrency ? '\u00A0FCFA' : ''}`;
}

function addOne(digits: string): string {
  const chars = digits.split('');
  let carry = 1;

  for (let index = chars.length - 1; index >= 0 && carry > 0; index -= 1) {
    const next = Number(chars[index]) + carry;
    chars[index] = String(next % 10);
    carry = Math.floor(next / 10);
  }

  return carry > 0 ? `1${chars.join('')}` : chars.join('');
}
