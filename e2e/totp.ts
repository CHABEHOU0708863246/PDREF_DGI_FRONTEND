import { createHmac } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function decodeBase32(value: string): Buffer {
  const clean = value.replace(/\s+/g, '').replace(/=+$/g, '').toUpperCase();
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const character of clean) {
    const index = ALPHABET.indexOf(character);
    if (index < 0) {
      throw new Error(`Secret TOTP invalide : ${value}`);
    }
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function totp(secret: string, at: Date = new Date()): string {
  const step = Math.floor(at.getTime() / 1000 / 30);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac('sha1', decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(value % 1_000_000).padStart(6, '0');
}

export function nextTotp(secret: string): string {
  return totp(secret, new Date(Date.now() + 31_000));
}
