const CORRELATION_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

export function newCorrelationId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  const random = Math.floor(Math.random() * 1_000_000_000).toString(36);
  return `pdref-${Date.now().toString(36)}-${random}`;
}

export function isCorrelationId(value: string | null | undefined): value is string {
  return typeof value === 'string' && CORRELATION_PATTERN.test(value);
}
