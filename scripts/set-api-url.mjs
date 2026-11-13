import { readFileSync, writeFileSync } from 'node:fs';

const apiUrl = (process.env.API_URL ?? '').trim().replace(/\/+$/, '');
if (!apiUrl) {
  console.log('API_URL non definie : apiUrl reste relative.');
  process.exit(0);
}

const file = 'src/environments/environment.ts';
const source = readFileSync(file, 'utf8');
const pattern = /apiUrl:\s*'[^']*'/;
if (!pattern.test(source)) {
  throw new Error(`apiUrl introuvable dans ${file}`);
}

const updated = source.replace(pattern, `apiUrl: '${apiUrl}'`);
if (source === updated) {
  console.log(`apiUrl deja configuree sur ${apiUrl}`);
  process.exit(0);
}

writeFileSync(file, updated, 'utf8');
console.log(`apiUrl configuree sur ${apiUrl}`);
