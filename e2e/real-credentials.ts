import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type RealCredentials = Record<string, string>;

export function loadRealCredentials(): RealCredentials {
  const path =
    process.env['E2E_REAL_CREDENTIALS'] ?? join(process.cwd(), 'e2e', '.real-credentials.json');
  if (!existsSync(path)) {
    throw new Error(
      `Fichier de comptes E2E introuvable : ${path}. Lancez scripts/e2e-real-stack.ps1.`,
    );
  }
  return JSON.parse(readFileSync(path, 'utf8')) as RealCredentials;
}

export function passwordFor(credentials: RealCredentials, login: string): string {
  const password = credentials[login];
  if (!password) {
    throw new Error(`Compte E2E absent du fichier de recette : ${login}.`);
  }
  return password;
}
