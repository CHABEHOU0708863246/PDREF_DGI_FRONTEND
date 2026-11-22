// Mode maintenance : tant que le fichier `maintenance.on` existe a la racine du projet,
// le service worker publie est remplace par le "safety worker" d'Angular. Il se
// desinstalle et vide le cache chez les utilisateurs deja venus, qui voient alors la page
// public/maintenance.html au lieu de l'ancienne application gardee en cache.
// Pour rouvrir la plateforme : supprimer `maintenance.on` et la redirection de vercel.json.
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

if (!existsSync('maintenance.on')) {
  console.log('Maintenance desactivee : service worker normal conserve.');
  process.exit(0);
}

const browser = join('dist', 'PDREF_FRONTEND', 'browser');
const safety = join(browser, 'safety-worker.js');
const worker = join(browser, 'ngsw-worker.js');
if (!existsSync(safety)) {
  throw new Error(`safety-worker.js introuvable dans ${browser}`);
}

copyFileSync(safety, worker);
console.log('Maintenance activee : ngsw-worker.js remplace par le safety worker.');
