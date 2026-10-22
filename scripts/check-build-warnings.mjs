import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const cli = join(process.cwd(), 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const result = spawnSync(process.execPath, [cli, 'build', '--configuration', 'production'], {
  encoding: 'utf8',
});

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
process.stdout.write(output);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (/\bWARNING\b|\bWarning\b/.test(output)) {
  console.error('Le build contient au moins un warning : clôture bloquee.');
  process.exit(1);
}

console.log('Build production sans warning.');
