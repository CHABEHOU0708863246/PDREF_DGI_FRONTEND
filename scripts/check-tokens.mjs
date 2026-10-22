import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = 'src/app';
const forbidden = [
  { pattern: /#[0-9a-fA-F]{3,8}\b/, label: 'couleur hexadecimale' },
  { pattern: /\brgba?\(/, label: 'couleur rgb' },
  { pattern: /\bhsla?\(/, label: 'couleur hsl' },
  { pattern: /\b\d+(?:\.\d+)?px\b/, label: 'valeur en px' },
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
    if (!path.endsWith('.scss')) {
      continue;
    }

    const content = readFileSync(path, 'utf8');
    for (const rule of forbidden) {
      const match = content.match(rule.pattern);
      if (match) {
        failures.push(`${path}: ${rule.label} (${match[0]})`);
      }
    }
  }
}

walk(root);

if (failures.length > 0) {
  console.error('Valeurs en dur detectees dans les styles de composants :');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Aucune valeur en dur (couleur/px) dans les SCSS de composants.');
