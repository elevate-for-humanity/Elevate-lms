import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { hasGetRouteHandler } from './portal-route-contract.mjs';
import { hasProgramHolderWorkspaceGuard } from './portal-guard-contract.mjs';

const source = readFileSync(new URL('./audit-portal-functions.mjs', import.meta.url), 'utf8');
const routePattern = source.slice(source.indexOf('function pattern('), source.indexOf('const routeIndex'));
const resolvers = source.slice(source.indexOf('function normalizeDynamicTarget('), source.indexOf('function hasBalancedInterpolation('));
const files = { get: 'export async function GET() {}', post: 'export async function POST() {}', constant: 'export const GET = handler;' };
const exists = vm.runInNewContext(routePattern + resolvers + '\nexistsPortalAction', {
  routeIndex: { lms: [{ route: '/workforce/dashboard' }, ...[
    { route: '/workforce/wioa-export/download', file: 'get' },
    { route: '/workforce/post-only', file: 'post' },
    { route: '/workforce/constant', file: 'constant' },
  ].filter(entry => hasGetRouteHandler(files[entry.file]))] },
  apiIndex: { lms: [
    { route: '/workforce/wioa-export/download', file: 'get' },
    { route: '/workforce/post-only', file: 'post' },
    { route: '/workforce/constant', file: 'constant' },
  ] },
  readFileSync: name => files[name],
});

test('portal actions accept pages and GET downloads, preserving missing-route and method checks', () => {
  assert.equal(exists('lms', '/workforce/dashboard'), true);
  assert.equal(exists('lms', '/workforce/wioa-export/download?format=csv'), true);
  assert.equal(exists('lms', '/workforce/constant'), true);
  assert.equal(exists('lms', '/workforce/post-only'), false);
  assert.equal(exists('lms', '/workforce/missing'), false);
});

function checkGuard(guard) {
  const root = mkdtempSync(join(tmpdir(), 'preauth-guard-'));
  const write = (path, value) => {
    const target = join(root, path);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, value);
  };
  try {
    write('scripts/check.cjs', readFileSync(new URL('./check-pre-auth-registry.cjs', import.meta.url)));
    write('lib/pre-auth-tables.ts', "export const tables = [{ table: 'a_different_registered_table' }];");
    write('apps/lms/app/api/attendance/route.ts', guard + "\nawait db.from('host_shop_attendance_records').insert({ student_id: user.id });");
    return spawnSync(process.execPath, ['scripts/check.cjs'], { cwd: root, encoding: 'utf8' });
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test('the canonical Host Shop guard is recognized without registering attendance as anonymous', () => {
  const result = checkGuard('await requireCurrentHostShopPartner();');
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('unguarded identity writes and an unused guard import still fail', () => {
  for (const guard of ['', "import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';"]) {
    const result = checkGuard(guard);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /host_shop_attendance_records/);
  }
});


test('exam access must use the canonical guard and handle a denial before writing', () => {
  const imported = "import { requireExamSessionAccess } from '@/lib/testing/session-access';";
  const invoked = 'const access = await requireExamSessionAccess(sessionId);';
  const deny = 'if (access instanceof NextResponse) return access;';
  const guarded = checkGuard([imported, invoked, deny].join('\n'));
  assert.equal(guarded.status, 0, guarded.stdout + guarded.stderr);
  for (const unsafe of [
    imported,
    [imported, invoked].join('\n'),
    [imported.replace('@/lib/testing/session-access', './other'), invoked, deny].join('\n'),
    [imported, "await db.from('exam_events').insert({ user_id: user.id });", invoked, deny].join('\n'),
  ]) {
    const result = checkGuard(unsafe);
    assert.equal(result.status, 1, result.stdout + result.stderr);
  }
});

const pagePath = 'apps/lms/app/program-holder/dashboard/page.tsx';
const workspacePath = 'lib/program-holder/workspace.ts';
const repoRoot = new URL('../', import.meta.url).pathname;
const holderPage = readFileSync(join(repoRoot, pagePath), 'utf8');
const holderWorkspace = readFileSync(join(repoRoot, workspacePath), 'utf8');
const pageCall = 'const workspace = await getProgramHolderWorkspace();';
const guardCall = 'const ctx = await requireProgramHolder();';
const guardAudit = source.slice(source.indexOf('const requiredHelpers ='), source.indexOf('\nif (failures)'));

function auditHolder(overrides = {}) {
  const failures = [];
  vm.runInNewContext(guardAudit, {
    ROOT: repoRoot, join, hasProgramHolderWorkspaceGuard,
    readFileSync: (path, encoding) => overrides[path] ?? readFileSync(path, encoding),
    fail: message => failures.push(message), pass() {},
  });
  return failures;
}

test('the actual portal audit proves the dashboard loader authorizes before all workspace reads', () => {
  assert.equal(hasProgramHolderWorkspaceGuard(holderPage, holderWorkspace), true);
  assert.deepEqual(auditHolder(), []);
});

test('the proof follows genuine named-import aliases, not a helper-name substring', () => {
  const page = holderPage
    .replace('{ getProgramHolderWorkspace }', '{ getProgramHolderWorkspace as loadWorkspace }')
    .replace('await getProgramHolderWorkspace()', 'await loadWorkspace()');
  const workspace = holderWorkspace
    .replace('{ requireProgramHolder }', '{ requireProgramHolder as authorizeHolder }')
    .replace('await requireProgramHolder()', 'await authorizeHolder()');
  assert.equal(hasProgramHolderWorkspaceGuard(page, workspace), true);
});

for (const [label, path, altered] of [
  ['an unused loader import', pagePath, holderPage.replace(pageCall, 'const workspace = {};')],
  ['a comment-only loader call', pagePath, holderPage.replace(pageCall, '// ' + pageCall + '\n const workspace = {};')],
  ['an unawaited loader', pagePath, holderPage.replace(pageCall, 'const workspace = getProgramHolderWorkspace();')],
  ['a conditional loader', pagePath, holderPage.replace(pageCall, 'if (allowed) { ' + pageCall + ' }')],
  ['a page read before authorization', pagePath, holderPage.replace(pageCall, "await db.from('private_records').select('*');\n" + pageCall)],
  ['a page return before authorization', pagePath, holderPage.replace(pageCall, 'return <PrivateRecords />;\n' + pageCall)],
  ['a swallowed loader denial', pagePath, holderPage.replace(pageCall, 'const workspace = await getProgramHolderWorkspace().catch(() => ({}));')],
  ['a loader imported from another module', pagePath, holderPage.replace("'@/lib/program-holder/workspace'", "'./unguarded-workspace'")],
  ['page parameter execution before authorization', pagePath, holderPage.replace('function Page()', 'function Page(value = readPrivateRecords())')],
  ['module execution before the page guard', pagePath, holderPage + '\nconst leaked = readPrivateRecords();'],
  ['a hoisted local function shadowing the loader import', pagePath, holderPage.replace(pageCall, pageCall + '\nfunction getProgramHolderWorkspace() { return {}; }')],
  ['an unused canonical guard import', workspacePath, holderWorkspace.replace(guardCall, 'const ctx = {};')],
  ['a comment-only canonical guard', workspacePath, holderWorkspace.replace(guardCall, '// ' + guardCall + '\nconst ctx = {};')],
  ['an unawaited canonical guard', workspacePath, holderWorkspace.replace(guardCall, 'const ctx = requireProgramHolder();')],
  ['a conditional canonical guard', workspacePath, holderWorkspace.replace(guardCall, 'if (allowed) { ' + guardCall + ' }')],
  ['a workspace read before authorization', workspacePath, holderWorkspace.replace(guardCall, "await db.from('program_holders').select('*');\n" + guardCall)],
  ['a workspace return before authorization', workspacePath, holderWorkspace.replace(guardCall, 'return {};\n' + guardCall)],
  ['a swallowed canonical guard denial', workspacePath, holderWorkspace.replace(guardCall, 'const ctx = await requireProgramHolder().catch(() => ({}));')],
  ['an optional canonical guard', workspacePath, holderWorkspace.replace(guardCall, 'const ctx = await requireProgramHolder?.();')],
  ['a parallel private read and guard', workspacePath, holderWorkspace.replace(guardCall, 'const ctx = await Promise.all([requireProgramHolder(), readPrivateRecords()]);')],
  ['weakened guard options', workspacePath, holderWorkspace.replace(guardCall, 'const ctx = await requireProgramHolder({ allowPendingApproval: true });')],
  ['a guard imported from another module', workspacePath, holderWorkspace.replace("'@/lib/auth/require-program-holder'", "'./fake-authority'")],
  ['a type-only guard import', workspacePath, holderWorkspace.replace('import { requireProgramHolder }', 'import type { requireProgramHolder }')],
  ['a guarded function that is not the actual exported loader', workspacePath, holderWorkspace.replace('export async function getProgramHolderWorkspace()', 'export async function unusedGuardedLoader()') + '\nexport async function getProgramHolderWorkspace() { return {}; }'],
  ['module execution before the workspace guard', workspacePath, holderWorkspace + '\nconst leaked = readPrivateRecords();'],
  ['a hoisted local function shadowing the guard import', workspacePath, holderWorkspace.replace(guardCall, guardCall + '\nfunction requireProgramHolder() { return {}; }')],
  ['a hoisted local variable shadowing the guard import', workspacePath, holderWorkspace.replace(guardCall, guardCall + '\nvar requireProgramHolder = () => ({});')],
  ['a computed module method that executes before authorization', workspacePath, holderWorkspace + '\nconst leaked = { [readPrivateRecords()]() {} };'],
]) {
  test(`the actual portal audit rejects ${label}`, () => {
    const original = path === pagePath ? holderPage : holderWorkspace;
    assert.notEqual(altered, original, 'regression mutation must change the actual source');
    const failures = auditHolder({ [join(repoRoot, path)]: altered });
    assert.equal(failures.length, 1, failures.join('\n'));
    assert.match(failures[0], /program-holder\/dashboard\/page\.tsx bypasses canonical requireProgramHolder/);
  });
}
