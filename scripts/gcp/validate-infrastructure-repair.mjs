import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const [base, patch] = process.argv.slice(2);
if (![base, patch].every(sha => /^[a-f0-9]{40}$/.test(sha ?? ''))) throw Error('Immutable repair commits required');
const require = createRequire(join(process.cwd(), 'package.json'));
const yaml = require('js-yaml');
// The patch must never supply its own validator implementation.
const trustedModule = execFileSync('git', ['show', `${base}:lib/devstudio/infrastructure-repair.mjs`], {encoding:'utf8'});
const { assertDeploymentInvariants } = await import('data:text/javascript;base64,' + Buffer.from(trustedModule).toString('base64'));
const files = execFileSync('git', ['diff', '--name-only', base, patch], { encoding: 'utf8' }).trim().split('\n');
for (const path of files.filter(path => path.startsWith('.github/workflows/'))) {
  const read = sha => yaml.load(execFileSync('git', ['show', `${sha}:${path}`], { encoding: 'utf8' }));
  assertDeploymentInvariants(read(base), read(patch));
}
console.log('Trusted deployment repair validation passed');
