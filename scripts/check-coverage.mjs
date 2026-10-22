import { existsSync, readFileSync } from 'node:fs';

const path = 'coverage/PDREF_FRONTEND/coverage-summary.json';
if (!existsSync(path)) {
  console.error('Rapport de couverture introuvable.');
  process.exit(1);
}

const summary = JSON.parse(readFileSync(path, 'utf8'));
const total = summary.total;
const thresholds = { lines: 70, branches: 70, functions: 70, statements: 70 };
let failed = false;

for (const [key, threshold] of Object.entries(thresholds)) {
  const pct = total[key].pct;
  console.log(`${key}: ${pct}% (seuil ${threshold}%)`);
  if (pct < threshold) {
    failed = true;
  }
}

const categories = {
  services: /[\\/]core[\\/]services[\\/]/,
  guards: /[\\/]core[\\/]guards[\\/]/,
  interceptors: /[\\/]core[\\/]interceptors[\\/]/,
};

for (const [name, pattern] of Object.entries(categories)) {
  let covered = 0;
  let valid = 0;
  for (const [file, data] of Object.entries(summary)) {
    if (file === 'total' || !pattern.test(file)) {
      continue;
    }
    covered += data.lines.covered;
    valid += data.lines.total;
  }
  const pct = valid === 0 ? 100 : (covered / valid) * 100;
  console.log(`${name} (lignes): ${pct.toFixed(2)}% (seuil 80%)`);
  if (pct < 80) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log('Couverture conforme (global 70 %, services/guards/interceptors 80 %).');
