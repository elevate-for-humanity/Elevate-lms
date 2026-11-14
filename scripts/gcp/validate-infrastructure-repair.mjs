import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [base, patch] = process.argv.slice(2);
if (![base, patch].every(sha => /^[a-f0-9]{40}$/.test(sha ?? ''))) throw Error('Immutable repair commits required');
const require = createRequire(join(process.cwd(), 'package.json'));
const yaml = require('js-yaml');
const { assertDeploymentInvariants } = await import(pathToFileURL(join(process.cwd(), 'lib/devstudio/infrastructure-repair.mjs')));
const files = execFileSync('git', ['diff', '--name-only', base, patch], { encoding: 'utf8' }).trim().split('\n');
for (const path of files.filter(path => path.startsWith('.github/workflows/'))) {
  const read = sha => yaml.load(execFileSync('git', ['show', `${sha}:${path}`], { encoding: 'utf8' }));
  assertDeploymentInvariants(read(base), read(patch));
}
console.log('Trusted deployment repair validation passed');
