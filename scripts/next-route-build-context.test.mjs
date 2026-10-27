import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Recursive directory exclusions apply to application source as well as
// generated output. Check every tracked Next page and API route for collisions.
const routes = execFileSync('git', ['ls-files', 'apps/**/app/**/page.tsx', 'apps/**/app/**/route.ts'], { encoding: 'utf8' }).trim().split('\n');
function collisions(source) {
  const names = source.split(/\r?\n/).map(line => line.trim())
    .flatMap(line => /^\*\*\/([\w.-]+)\/?$/.exec(line)?.slice(1) ?? []);
  return routes.filter(route => route.split('/').some(segment => names.includes(segment)));
}
test('production pages and APIs survive recursive build-context directory exclusions', () => {
  assert.equal(routes.length > 500, true);
  assert.deepEqual(collisions(readFileSync('.dockerignore', 'utf8')), []);
});
test('the guard catches the reports and logs packaging regression', () => {
  const omitted = collisions('**/reports\n**/logs\n');
  assert(omitted.includes('apps/admin/app/reports/page.tsx'));
  assert(omitted.some(path => path.includes('/api/') && path.includes('/reports/')));
});
