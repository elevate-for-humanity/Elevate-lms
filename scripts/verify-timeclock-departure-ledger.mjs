import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(process.env.TIMECLOCK_TEST_DEPS || import.meta.url);
const { PGlite } = require('@electric-sql/pglite');
const db = new PGlite();
const root = new URL('../', import.meta.url);
const migration = readFileSync(new URL('supabase/migrations/20261105215858_repair_timeclock_departure_and_ledger_sync.sql', root), 'utf8');
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create function auth.uid() returns uuid language sql as 'select null::uuid';
    create table apprentices(id uuid primary key, user_id uuid);
    create table hour_entries(id uuid primary key default gen_random_uuid(), user_id uuid,
      source_type text, work_date date, hours_claimed numeric,
      constraint hour_entries_hours_claimed_check check(hours_claimed > 0),
      status text, entered_by_email text, entered_at timestamptz,
      progress_entry_id uuid unique);
    create table progress_entries(id uuid primary key default gen_random_uuid(), apprentice_id uuid,
      site_id uuid, clock_in_at timestamptz, clock_out_at timestamptz,
      lunch_start_at timestamptz, lunch_end_at timestamptz, break_minutes int,
      hours_worked numeric(8,2), outside_geofence_since timestamptz,
      auto_clocked_out boolean default false, auto_clock_out_reason text,
      updated_at timestamptz, last_known_lat numeric, last_known_lng numeric,
      last_location_at timestamptz, work_date date, hour_entry_id uuid);
    create table audit_logs(action text, actor_id uuid, target_type text, target_id uuid, metadata jsonb);
    create function is_within_geofence(uuid,numeric,numeric) returns boolean
      language sql as 'select $2 = 0 and $3 = 0';
    -- Existing production derivation and locked-hour protection remain active.
  `);
  await db.exec(readFileSync(new URL('supabase/migrations/20260301000006_hour_entries_lock_triggers.sql', root), 'utf8'));
  // The original deployed hours derivation is used to exercise the AFTER sync.
  const original = readFileSync(new URL('supabase/migrations/20260130000003_timeclock_gps_enforcement.sql', root), 'utf8');
  const derive = original.match(/CREATE OR REPLACE FUNCTION derive_hours_worked\(\)[\s\S]*?\$\$;/i);
  assert.ok(derive, 'existing hours derivation found');
  await db.exec(derive[0]);
  await db.exec(`create trigger trigger_derive_hours_worked before insert or update on progress_entries
    for each row execute function derive_hours_worked();`);
  await db.exec(migration);
  const apprentice = '10000000-0000-4000-8000-000000000001';
  const user = '20000000-0000-4000-8000-000000000001';
  await db.query('insert into apprentices values ($1,$2)', [apprentice, user]);
  const createShift = async (outside = '20 minutes') => (await db.query(`insert into progress_entries
      (apprentice_id, work_date, clock_in_at, outside_geofence_since, hours_worked)
      values ($1,current_date,now()-interval '6 hours',now()-$2::interval,0) returning id`, [apprentice,outside])).rows[0].id;
  const row = async id => (await db.query('select * from progress_entries where id=$1', [id])).rows[0];
  const ledger = async id => (await db.query('select * from hour_entries where progress_entry_id=$1', [id])).rows[0];
  const call = id => db.query('select * from auto_clock_out_if_needed($1)', [id]);

  const cronShift = await createShift();
  const closed = (await call(cronShift)).rows[0];
  assert.equal(closed.was_clocked_out, true);
  let shift = await row(cronShift);
  assert.equal(new Date(shift.clock_out_at).getTime(), new Date(shift.outside_geofence_since).getTime());
  assert.equal(Number(shift.hours_worked), 5.67);
  assert.equal(Number((await ledger(cronShift)).hours_claimed), 5.67);
  assert.equal((await call(cronShift)).rows[0].was_clocked_out, false);
  assert.equal((await db.query('select count(*)::int count from hour_entries')).rows[0].count,1);

  await db.query(`update progress_entries set clock_out_at=clock_in_at+interval '5 hours 47 minutes' where id=$1`,[cronShift]);
  assert.equal(Number((await ledger(cronShift)).hours_claimed), 5.78);
  assert.equal((await ledger(cronShift)).status,'pending');
  await db.query(`update progress_entries set lunch_start_at=clock_in_at+interval '2 hours',
    lunch_end_at=clock_in_at+interval '3 hours' where id=$1`,[cronShift]);
  assert.equal(Number((await ledger(cronShift)).hours_claimed),4.78);
  await db.query(`update progress_entries set work_date=current_date-1 where id=$1`,[cronShift]);
  assert.equal(String((await ledger(cronShift)).work_date),String((await row(cronShift)).work_date));
  assert.equal((await db.query('select count(*)::int count from audit_logs')).rows[0].count,3);

  const heartbeatShift=await createShift('30 minutes');
  await db.query('select * from update_geofence_state($1,1,1)',[heartbeatShift]);
  shift=await row(heartbeatShift);
  assert.equal(Number(shift.hours_worked),5.5);
  assert.equal(new Date(shift.clock_out_at).getTime(),new Date(shift.outside_geofence_since).getTime());
  assert.equal(Number((await ledger(heartbeatShift)).hours_claimed),5.5);
  const graceShift=await createShift('10 minutes');
  assert.equal((await call(graceShift)).rows[0].was_clocked_out,false);
  await db.query('select * from update_geofence_state($1,0,0)',[graceShift]);
  assert.equal((await row(graceShift)).outside_geofence_since,null);
  await db.query('select * from update_geofence_state($1,1,1)',[graceShift]);
  assert.equal((await row(graceShift)).clock_out_at,null);
  assert.ok((await row(graceShift)).outside_geofence_since);
  await assert.rejects(()=>db.query('select * from update_geofence_state($1,91,0)',[graceShift]),/Valid GPS/);

  for (const status of ['approved','locked']) {
    await db.query('update hour_entries set status=$2 where progress_entry_id=$1',[heartbeatShift,status]);
    const before=await row(heartbeatShift);
    await assert.rejects(()=>db.query(`update progress_entries set clock_out_at=clock_out_at-interval '1 minute' where id=$1`,[heartbeatShift]),/approved or locked/);
    assert.equal(String((await row(heartbeatShift)).clock_out_at),String(before.clock_out_at));
    assert.equal(Number((await ledger(heartbeatShift)).hours_claimed),5.5);
    // No-op shift writes must not attempt to mutate a protected ledger row.
    await db.query('update progress_entries set hours_worked=hours_worked where id=$1',[heartbeatShift]);
  }
  await assert.rejects(()=>db.query('update progress_entries set clock_out_at=null where id=$1',[cronShift]),/cannot be reopened/);
  const zeroShift=await createShift('8 hours');
  await call(zeroShift);
  assert.equal(Number((await row(zeroShift)).hours_worked),0);
  assert.equal(await ledger(zeroShift),undefined);
  await assert.rejects(()=>db.exec(`insert into hour_entries(source_type,hours_claimed) values ('manual',0)`));
  const acl=(await db.query(`select has_function_privilege('authenticated','auto_clock_out_if_needed(uuid)','execute') allowed`)).rows[0];
  assert.equal(acl.allowed,false);
  assert.equal((await db.query(`select has_function_privilege('service_role','update_geofence_state(uuid,numeric,numeric)','execute') allowed`)).rows[0].allowed,true);
  console.log('PASS: cron and heartbeat departure cutoff; grace and return; fractional hours; idempotency; pending corrections and lunch/date sync; audit trail; approved/locked rollback; zero-time evidence; service-only RPCs');
} finally { await db.close(); }
