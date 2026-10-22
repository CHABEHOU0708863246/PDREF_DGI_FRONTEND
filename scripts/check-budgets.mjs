import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const browserDir = 'dist/PDREF_FRONTEND/browser';
const initialBudget = 300 * 1024;
const featureBudget = 150 * 1024;

if (!existsSync(browserDir)) {
  console.error('Build introuvable : executez npm run build:prod avant check:budgets.');
  process.exit(1);
}

const indexFile = ['index.csr.html', 'index.html']
  .map((name) => join(browserDir, name))
  .find((path) => existsSync(path));

if (!indexFile) {
  console.error('Index client introuvable dans le build.');
  process.exit(1);
}

const indexHtml = readFileSync(indexFile, 'utf8');
const referenced = [...indexHtml.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) =>
  match[1].replace(/^\//, ''),
);

const initialFiles = new Set(referenced.filter((file) => existsSync(join(browserDir, file))));
const allFiles = readdirSync(browserDir).filter((file) => /\.(js|css)$/.test(file));

if (initialFiles.size === 0) {
  console.error('Aucun fichier initial detecte dans index.');
  process.exit(1);
}

function gzipSize(file) {
  return gzipSync(readFileSync(join(browserDir, file))).length;
}

let initialBytes = 0;
for (const file of initialFiles) {
  initialBytes += gzipSize(file);
}

const lazy = allFiles
  .filter((file) => !initialFiles.has(file) && file.endsWith('.js'))
  .map((file) => ({ file, bytes: gzipSize(file) }))
  .sort((left, right) => right.bytes - left.bytes);

let failed = false;
console.log(`Initial gzip : ${(initialBytes / 1024).toFixed(2)} KiB`);
if (initialBytes > initialBudget) {
  console.error(`Budget initial depasse : > ${(initialBudget / 1024).toFixed(0)} KiB`);
  failed = true;
}

for (const item of lazy) {
  const kib = (item.bytes / 1024).toFixed(2);
  console.log(`Lazy ${item.file} : ${kib} KiB`);
  if (item.bytes > featureBudget) {
    console.error(`Budget feature depasse pour ${item.file} : > 150 KiB gzip`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log('Budgets respectes.');
