// @vitest-environment node
import { expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
const source = readFileSync('.github/workflows/paris-code-repair.yml', 'utf8');
const tick = source.split('      - name: Tick PARIS and dispatch the claimed repair with workflow-owned identity')[1]
  ?.split('      - name: Report blocked recovery')[0];
const python = tick?.match(/python - <<'PYCODE'\r?\n([\s\S]*?)^          PYCODE\s*$/m)?.[1]
  .split('\n')
  .map((line) => line.slice(10))
  .join('\n');
const finish = python?.indexOf("\nendpoint=origin+'/api/cron/paris-code-repair'") ?? -1;
if (!python || finish < 0) throw new Error('PARIS monitor Python compatibility boundary not found');
const guard = python.slice(0, finish);
function check(fixture: unknown) {
  const program =
    `import os,json,re,urllib.request,io,sys\nf=json.load(sys.stdin)\nos.environ.update({'GITHUB_SHA':'a'*40,'GITHUB_REPOSITORY':'elevate-for-humanity/Elevate-lms','GH_TOKEN':'fixture','PARIS_ADMIN_ORIGIN':'https://admin.example','PARIS_HEALTH_TIMEOUT_SECONDS':'10','PARIS_GITHUB_TIMEOUT_SECONDS':'10'})\nos.environ.pop('GITHUB_OUTPUT',None)\ndef response(req,timeout):\n return io.StringIO(json.dumps(f['health'] if req.full_url.endswith('/api/ready') else f['releases'] if '/actions/runs?' in req.full_url else f['comparison']))\nurllib.request.urlopen=response\n` +
    guard +
    "\nprint('COMPATIBLE')\n";
  return execFileSync('python3', ['-c', program], {
    input: JSON.stringify(fixture),
    encoding: 'utf8',
  });
}
it('accepts the exact healthy runtime and a later workflow changing only browser/UI/docs', () => {
  expect(
    check({ health: { ready: true, agenticExecutorReady: true, commit: 'a'.repeat(40) } }),
  ).toContain('COMPATIBLE');
  expect(
    check({
      health: { ready: true, agenticExecutorReady: true, commit: 'b'.repeat(40) },
      comparison: {
        status: 'ahead',
        files: [
          { filename: 'services/studio-browser/cdp-snapshot.mjs' },
          { filename: 'docs/audit.md' },
        ],
      },
    }),
  ).toContain('COMPATIBLE');
});
it('defers unhealthy, divergent, renamed server code and incomplete comparison evidence', () => {
  const health = { ready: true, agenticExecutorReady: true, commit: 'b'.repeat(40) };
  for (const comparison of [
    { status: 'diverged', files: [] },
    { status: 'ahead', files: [{ filename: 'lib/ai/runtime/code-repair.ts' }] },
    {
      status: 'ahead',
      files: [{ filename: 'docs/moved.txt', previous_filename: 'lib/auth/guard.ts' }],
    },
    { status: 'ahead', files: Array.from({ length: 300 }, () => ({ filename: 'docs/audit.md' })) },
    { status: 'ahead' },
  ])
    expect(check({ health, comparison })).not.toContain('COMPATIBLE');
  expect(
    check({ health: { ready: false, agenticExecutorReady: true, commit: 'a'.repeat(40) } }),
  ).not.toContain('COMPATIBLE');
});

it('accepts a newer runtime only with its exact successful main Admin release', () => {
  const health = { ready: true, agenticExecutorReady: true, commit: 'b'.repeat(40) };
  const release = { head_sha: health.commit, head_branch: 'main',
    path: '.github/workflows/deploy-admin.yml', event: 'workflow_dispatch',
    status: 'completed', conclusion: 'success' };
  const fixture = { health, comparison: { status: 'behind', files: [] } };
  expect(check({ ...fixture, releases: { workflow_runs: [release] } })).toContain('COMPATIBLE');
  for (const changed of [
    { head_sha: 'c'.repeat(40) }, { head_branch: 'work' },
    { path: '.github/workflows/deploy-lms.yml' }, { event: 'push' },
    { status: 'queued' }, { conclusion: 'failure' },
  ]) expect(check({ ...fixture, releases: { workflow_runs: [{ ...release, ...changed }] } }))
    .not.toContain('COMPATIBLE');
  expect(check({ ...fixture, releases: { workflow_runs: [] } })).not.toContain('COMPATIBLE');
});

it('does not starve unchanged repairs behind the two public-only routing modules', () => {
  const health = { ready: true, agenticExecutorReady: true, commit: 'b'.repeat(40) };
  expect(
    check({
      health,
      comparison: {
        status: 'ahead',
        files: [
          { filename: 'lib/navigation/student-support.ts' },
          { filename: 'lib/routing/public-entry-aliases.mjs' },
          { filename: 'apps/marketing/middleware.ts' },
        ],
      },
    }),
  ).toContain('COMPATIBLE');
  for (const filename of [
    'lib/routing/portal-map.ts',
    'lib/auth/portal-access.ts',
    'lib/devstudio/paris-code-engineer.ts',
    'lib/ai/ai-service.ts',
    'apps/admin/app/api/cron/paris-code-repair/route.ts',
    'packages/repair/index.ts',
  ]) {
    expect(check({ health, comparison: { status: 'ahead', files: [{ filename }] } })).not.toContain(
      'COMPATIBLE',
    );
    expect(
      check({
        health,
        comparison: {
          status: 'ahead',
          files: [{ filename: 'lib/navigation/student-support.ts', previous_filename: filename }],
        },
      }),
    ).not.toContain('COMPATIBLE');
  }
});

it('keeps compatibility exceptions outside Admin, LMS and repair-runtime dependencies', () => {
  const publicOnly = [
    'lib/navigation/student-support.ts',
    'lib/routing/public-entry-aliases.mjs',
  ].map((path) => resolve(path));
  const violations: string[] = [];
  for (const root of [
    'lib',
    'apps/admin',
    'apps/lms',
    'components',
    'packages',
    'workers',
    'remotion-src',
  ]) {
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root, { recursive: true })) {
      const file = join(root, String(entry));
      if (
        !/\.(?:[cm]?[jt]sx?)$/.test(file) ||
        /(?:node_modules|\.next|\.test\.|\.spec\.)/.test(file)
      )
        continue;
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g)) {
        const specifier = match[1];
        const target = specifier.startsWith('@/')
          ? resolve(specifier.slice(2))
          : specifier.startsWith('.')
            ? resolve(dirname(file), specifier)
            : null;
        if (
          target &&
          publicOnly.some((path) => [target, target + '.ts', target + '.mjs'].includes(path)) &&
          resolve(file) !== resolve('lib/navigation/student-support.ts')
        )
          violations.push(file);
      }
    }
  }
  expect(violations).toEqual([]);
});

it('requires executor readiness even when configuration and source identity are valid', () => {
  for (const health of [
    { ready: true, agenticExecutorReady: false, commit: 'a'.repeat(40) },
    { ready: true, commit: 'a'.repeat(40) },
    { healthy: true, commit: 'a'.repeat(40) },
    { ready: true, agenticExecutorReady: true, commit: 'invalid' },
  ])
    expect(check({ health })).not.toContain('COMPATIBLE');
});
