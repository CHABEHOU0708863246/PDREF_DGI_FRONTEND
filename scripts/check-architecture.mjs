import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = 'src/app';
const forbiddenPackages = [
  '@capacitor/',
  'chart.js',
  'ng2-charts',
  'qrcode',
  'jwt-decode',
  'boxicons',
  '@angular/material',
];
const failures = [];

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      walk(path);
      continue;
    }
    if (!path.endsWith('.ts') || path.endsWith('.spec.ts')) {
      continue;
    }

    const content = readFileSync(path, 'utf8');
    const feature = path.match(/src[\\/]app[\\/]features[\\/]([^\\/]+)/)?.[1];

    for (const match of content.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const target = match[1];

      if (forbiddenPackages.some((item) => target.startsWith(item))) {
        failures.push(`${path}: import interdit ${target}`);
      }

      if (path.includes(`${join('src', 'app', 'core')}`) && /features[\\/]/.test(target)) {
        failures.push(`${path}: core ne peut pas importer une feature (${target})`);
      }

      if (feature) {
        const targetFeature = target.match(/features[\\/]([^\\/]+)/)?.[1];
        if (targetFeature && targetFeature !== feature) {
          failures.push(`${path}: une feature ne peut pas importer une autre feature (${target})`);
        }
      }
    }

    const isStorage = path.endsWith('storage.service.ts');
    const isLogger = path.endsWith('logger.service.ts');

    if (!isStorage && /\b(localStorage|sessionStorage)\b/.test(content)) {
      failures.push(`${path}: acces direct a localStorage/sessionStorage interdit`);
    }
    if (!isLogger && /\bconsole\./.test(content)) {
      failures.push(`${path}: console.* interdit hors LoggerService`);
    }
    if (/\bdocument\.cookie\b/.test(content)) {
      failures.push(`${path}: document.cookie interdit`);
    }
    if (/\binnerHTML\b|bypassSecurityTrust/.test(content)) {
      failures.push(`${path}: innerHTML/bypassSecurityTrust interdit`);
    }
  }
}

walk(root);

if (failures.length > 0) {
  console.error('Regles d architecture violees :');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Architecture respectee : features -> core uniquement, aucune feature croisee.');
