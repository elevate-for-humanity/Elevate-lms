// Run with @electric-sql/pglite 0.3.14 available in the test environment.
import { createRequire } from 'node:module';
const require = createRequire(process.env.HVAC_TEST_DEPS || import.meta.url);
const { PGlite } = require('@electric-sql/pglite');
const ts = require('typescript');
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url).pathname;
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;
create schema auth; create function auth.uid() returns uuid language sql as 'select null::uuid';
create table auth.users(id uuid primary key);
create table program_enrollments(id uuid primary key,user_id uuid,program_slug text,status text,tenant_id uuid,revoked_at timestamptz,suspended_at timestamptz,cancelled_at timestamptz);
create table attendance_hours(id uuid primary key default gen_random_uuid(),user_id uuid,enrollment_id uuid,tenant_id uuid,date date,hours_logged numeric,hours_worked numeric,type text,logged_by uuid,verified boolean,status text,notes text);`);
await db.exec(
  fs.readFileSync(root + 'supabase/migrations/20261016165327_hvac_online_study_clock.sql', 'utf8'),
);
await db.exec(
  fs.readFileSync(
    root + 'supabase/migrations/20261016165546_hvac_online_study_long_session_review.sql',
    'utf8',
  ),
);
const uid = '11111111-1111-4111-8111-111111111111',
  other = '22222222-2222-4222-8222-222222222222',
  eid = '33333333-3333-4333-8333-333333333333';
await db.query('insert into auth.users values ($1),($2)', [uid, other]);
await db.query(
  "insert into program_enrollments(id,user_id,program_slug,status) values($1,$2,'hvac-technician','active')",
  [eid, uid],
);
const act = (u, a) => db.query('select * from record_hvac_online_study($1,$2,$3)', [u, eid, a]);
await assert.rejects(() => act(other, 'clock_in'));
await assert.rejects(() => act(uid, 'clock_out'));
await assert.rejects(() => act(uid, 'invented'));
const first = (await act(uid, 'clock_in')).rows[0];
assert.equal((await act(uid, 'clock_in')).rows[0].id, first.id);
await db.query("update online_study_sessions set clock_in_at=now()-interval '90 minutes'");
await db.query("update program_enrollments set status='suspended'");
await act(uid, 'clock_out'); // Closing is allowed after suspension, preventing stuck shifts.
let hours = (await db.query('select * from attendance_hours')).rows;
assert.equal(Number(hours[0].hours_logged), 1.5);
assert.equal(hours[0].verified, false);
assert.equal(hours[0].status, 'pending');
await assert.rejects(() => act(uid, 'clock_in'));
await db.query("update program_enrollments set status='active'");
await act(uid, 'clock_in');
await db.query(
  "update online_study_sessions set clock_in_at=now()-interval '13 hours' where clock_out_at is null",
);
await act(uid, 'clock_out');
hours = (await db.query('select * from attendance_hours')).rows;
assert.equal(hours.length, 2);
assert.ok(hours.some((x) => x.notes.includes('Missed clock-out') && Number(x.hours_logged) === 0));
assert.ok(hours.some((x) => x.notes.includes('Missed clock-out')));
const grants = (
  await db.query(
    "select has_function_privilege('authenticated','record_hvac_online_study(uuid,uuid,text)','execute') allowed",
  )
).rows[0];
assert.equal(grants.allowed, false);
for (const file of [
  'apps/lms/app/api/attendance/online/route.ts',
  'components/learner/OnlineStudyClock.tsx',
  'components/learner/HvacOrientation.tsx',
  'apps/lms/app/lms/(app)/attendance/page.tsx',
  'apps/lms/app/lms/(app)/dashboard/page.tsx',
  'apps/lms/app/lms/(app)/orientation/page.tsx',
]) {
  const result = ts.transpileModule(fs.readFileSync(root + file, 'utf8'), {
    fileName: file,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    reportDiagnostics: true,
  });
  assert.equal(
    result.diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error).length,
    0,
    file,
  );
}
console.log(
  'PASS: ownership, active enrollment, duplicate clock-in, invalid actions, server time, pending review, long-session flag, closing after suspension, service-only execution, TS/TSX syntax',
);
await db.close();
