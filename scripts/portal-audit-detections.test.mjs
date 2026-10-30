import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const source = readFileSync(new URL('./audit-portal-functions.mjs', import.meta.url), 'utf8');
const routePattern = source.slice(source.indexOf('function pattern('), source.indexOf('const routeIndex'));
const resolvers = source.slice(source.indexOf('function normalizeDynamicTarget('), source.indexOf('function hasBalancedInterpolation('));
const files = { get: 'export async function GET() {}', post: 'export async function POST() {}', constant: 'export const GET = handler;' };
const exists = vm.runInNewContext(routePattern + resolvers + '\nexistsPortalAction', {
  routeIndex: { lms: [{ route: '/workforce/dashboard' }] },
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
