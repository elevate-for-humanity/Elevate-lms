import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

const actor = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const tenant = '33333333-3333-4333-8333-333333333333';
const course = '44444444-4444-4444-8444-444444444444';
const build = '55555555-5555-4555-8555-555555555555';
const job = '66666666-6666-4666-8666-666666666666';
const ordinary = '77777777-7777-4777-8777-777777777777';
const migration = await readFile(new URL('../../supabase/migrations/20261018092227_external_course_compute.sql', import.meta.url), 'utf8');
const wallet = await readFile(new URL('../../supabase/migrations/20260825124500_tenant_course_builder_credits.sql', import.meta.url), 'utf8');
const claimSource = await readFile(new URL('../../supabase/migrations/20261011060000_course_execution_fencing.sql', import.meta.url), 'utf8');
const claim = claimSource.slice(claimSource.indexOf('CREATE OR REPLACE FUNCTION public.claim_ultimate_build_job('), claimSource.indexOf('-- Expired leases'));

async function fixture(t, customer = false) {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create function auth.jwt() returns jsonb language sql as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.role() returns text language sql as $$ select auth.jwt()->>'role' $$;
    create function auth.uid() returns uuid language sql as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
    create table auth.users(id uuid primary key);
    create table public.tenants(id uuid primary key);
    create table public.profiles(id uuid primary key,tenant_id uuid,role text);
    create type public.course_status as enum ('draft','published','archived');
    create table public.courses(id uuid primary key,created_by uuid,status public.course_status default 'draft');
    create table public.ultimate_course_builds(id uuid primary key,course_id uuid);
    create table public.ultimate_build_jobs(id uuid primary key,build_id uuid,job_type text default 'course_build',
      status text default 'queued',priority integer default 1,attempts integer default 0,max_attempts integer default 3,
      execution_generation bigint default 1,lease_owner text,lease_expires_at timestamptz,heartbeat_at timestamptz,
      available_at timestamptz default now(),created_at timestamptz default now(),updated_at timestamptz default now(),
      last_error text,payload jsonb default '{}');
    create table public.ultimate_job_attempt_history(job_id uuid,execution_generation bigint,worker_id text,event_type text,details jsonb default '{}');
    create table public.organizations(id uuid primary key,tenant_id uuid);
    create table public.organization_subscriptions(organization_id uuid,plan_id uuid,status text,current_period_end timestamptz);
    create table public.plan_features(plan_id uuid,feature_id uuid);
    create table public.features(id uuid,code text);
    create table public.provider_usage_ledger(scope_key text,tenant_id uuid,actor_id uuid,job_id uuid,artifact_fingerprint text,
      provider text,model text,operation text,input_units numeric,output_units numeric,estimated_cost_micros bigint,
      actual_cost_micros bigint,latency_ms bigint,status text,retry_classification text);
    set request.jwt.claims='{"role":"service_role"}';
  `);
  await db.exec(wallet);
  await db.exec(claim);
  await db.exec(migration);
  await db.query('insert into auth.users values ($1),($2)', [actor, other]);
  await db.query('insert into tenants values ($1)', [tenant]);
  await db.query("insert into profiles values ($1,$2,$3),($4,null,'admin')", [actor, customer ? tenant : null, customer ? 'user' : 'admin', other]);
  await db.query('insert into courses(id,created_by) values ($1,$2)', [course, actor]);
  await db.query('insert into ultimate_course_builds values ($1,$2)', [build, course]);
  await db.query('insert into ultimate_build_jobs(id,build_id,payload) values ($1,$2,$3)', [job, build, JSON.stringify({lessonBuildId: build, competencyId: build, ownerPreview: true})]);
  await db.query('insert into ultimate_build_jobs(id,build_id) values ($1,$2)', [ordinary, build]);
  if (customer) {
    await db.query('insert into organizations values ($1,$2)', [tenant, tenant]);
    await db.query("insert into organization_subscriptions values ($1,$1,'active',now()+interval '30 days')", [tenant]);
    await db.query('insert into plan_features values ($1,$1)', [tenant]);
    await db.query("insert into features values ($1,'course_builder')", [tenant]);
    await db.query("select * from grant_tenant_course_builder_credits($1,'course-creation-learning-platform',1000,'test','test-grant')", [tenant]);
  }
  const authorize = async () => {
    for (const scope of customer ? ['platform', 'tenant:' + tenant] : ['platform'])
      await db.query(`insert into external_compute_policies(scope_key,enabled,daily_limit_micros,monthly_limit_micros,
        per_job_limit_micros,max_active,cpu_micros_per_second,memory_micros_per_gib_second,credits_per_job,approved_by)
        values($1,true,1000000,10000000,100000,2,10,5,300,$2)`, [scope, actor]);
  };
  const prepare = (who = actor, key = 'test-render') => db.query('select * from prepare_external_course_execution($1,$2,$3)', [job, who, key]);
  return {db, authorize, prepare};
}

test('migration leaves policies empty; paid work fails closed', async t => {
  const f = await fixture(t);
  await assert.rejects(f.prepare(), /NOT_FINANCIALLY_AUTHORIZED/);
  assert.equal((await f.db.query('select * from external_course_executions')).rows.length, 0);
});
test('one receipt reserves canonical credits once and is excluded from Google claims', async t => {
  const f = await fixture(t, true); await f.authorize();
  const first = (await f.prepare()).rows[0], second = (await f.prepare()).rows[0];
  assert.equal(first.id, second.id); assert.equal(first.credits_reserved, 300);
  const balance = (await f.db.query('select balance from tenant_course_builder_credit_wallets')).rows[0].balance;
  assert.equal(balance, 700);
  // An older deployed owner-preview worker may use a direct CAS update rather
  // than the canonical claim RPC. The database still refuses that ownership.
  await assert.rejects(f.db.query("update ultimate_build_jobs set status='running',lease_owner='old-google-preview' where id=$1", [job]), /EXCLUSIVE_OWNER_REQUIRED/);
  const google = (await f.db.query("select * from claim_ultimate_build_job('google')")).rows;
  assert.deepEqual(google.map(row => row.id), [ordinary]);
});
test('tenant mismatch, failed payment, absent allowance and live lease are rejected', async t => {
  const f = await fixture(t, true); await f.authorize();
  await assert.rejects(f.prepare(other), /TENANT_MISMATCH/);
  await f.db.exec("update organization_subscriptions set status='past_due'");
  await assert.rejects(f.prepare(), /ENTITLEMENT_REQUIRED/);
  await f.db.exec("update organization_subscriptions set status='active'; update tenant_course_builder_credit_wallets set balance=0");
  await assert.rejects(f.prepare(), /INSUFFICIENT_CREDITS/);
  assert.equal((await f.db.query('select * from external_course_executions')).rows.length, 0);
  await f.db.exec("update ultimate_build_jobs set status='running',lease_owner='existing',lease_expires_at=now()+interval '1 hour'");
  await assert.rejects(f.prepare(), /ELIGIBLE_EXACT_LESSON_REQUIRED/);
});
test('budget includes unresolved submissions and refuses another dispatch', async t => {
  const f = await fixture(t); await f.authorize();
  await f.db.exec('update external_compute_policies set per_job_limit_micros=1');
  await assert.rejects(f.prepare(), /PER_JOB_BUDGET/);
  await f.db.exec('update external_compute_policies set per_job_limit_micros=100000,daily_limit_micros=74000');
  await assert.rejects(f.prepare(), /DAILY_COMPUTE_BUDGET/);
  await f.db.exec('update external_compute_policies set daily_limit_micros=1000000');
  const r = (await f.prepare()).rows[0];
  const begin = await f.db.query('select * from begin_external_course_dispatch($1)', [r.id]);
  assert.equal(begin.rows.length, 1);
  assert.equal((await f.db.query('select * from begin_external_course_dispatch($1)', [r.id])).rows.length, 0);
  await f.db.query('select mark_external_course_uncertain($1)', [r.id]);
  assert.equal((await f.db.query('select * from begin_external_course_dispatch($1)', [r.id])).rows.length, 0);
});
test('atomic external claim has one worker, a new generation and canonical history', async t => {
  const f = await fixture(t); await f.authorize(); const r = (await f.prepare()).rows[0];
  await f.db.query('select * from begin_external_course_dispatch($1)', [r.id]);
  const results = await Promise.all(['modal-one','modal-two'].map(w => f.db.query('select * from claim_external_course_job($1,$2)', [r.id,w])));
  const claimed = results.flatMap(result => result.rows);
  assert.equal(claimed.length, 1); assert.equal(claimed[0].execution_generation, 2);
  assert.equal((await f.db.query('select * from ultimate_job_attempt_history')).rows.length, 1);
});
test('settlement refunds unused credits once and keeps provider invoice cost unknown', async t => {
  const f = await fixture(t, true); await f.authorize(); const r = (await f.prepare()).rows[0];
  await f.db.query('select * from begin_external_course_dispatch($1)', [r.id]);
  await f.db.query("select * from claim_external_course_job($1,'modal-one')", [r.id]);
  const settle = usage => f.db.query("select finish_external_course_execution($1,'modal-one',$2)", [r.id, JSON.stringify(usage)]);
  await assert.rejects(settle({wall_seconds: 600}), /STILL_LEASED/);
  await f.db.query("update ultimate_build_jobs set status='completed',lease_owner=null,lease_expires_at=null where id=$1", [job]);
  await settle({wall_seconds: 600}); await settle({wall_seconds: 600});
  assert.equal((await f.db.query('select balance from tenant_course_builder_credit_wallets')).rows[0].balance, 900);
  const events = (await f.db.query('select * from provider_usage_ledger')).rows;
  assert.equal(events.length, 1); assert.equal(events[0].actual_cost_micros, null);
  assert.equal(events[0].estimated_cost_micros, 24000);
  await assert.rejects(settle({wall_seconds: 300}), /SETTLEMENT_CONFLICT/);
});
test('cancellation before claim keeps the reservation and prevents work', async t => {
  const f = await fixture(t); await f.authorize(); const r = (await f.prepare()).rows[0];
  await f.db.query('select * from begin_external_course_dispatch($1)', [r.id]);
  await f.db.query('select * from request_external_course_cancel($1)', [r.id]);
  assert.equal((await f.db.query("select * from claim_external_course_job($1,'late-worker')", [r.id])).rows.length, 0);
  assert.equal((await f.db.query('select credits_settled from external_course_executions')).rows[0].credits_settled, null);
});
test('anonymous callers cannot reserve or claim external work', async t => {
  const f = await fixture(t); await f.authorize();
  await f.db.exec('set role anon');
  await assert.rejects(f.prepare(), /permission denied/);
  await assert.rejects(f.db.query("select * from claim_external_course_job($1,'attacker')", [job]), /permission denied/);
});
test('payment failure after reservation prevents a worker from starting', async t => {
  const f = await fixture(t, true); await f.authorize(); const r = (await f.prepare()).rows[0];
  await f.db.query('select * from begin_external_course_dispatch($1)', [r.id]);
  await f.db.exec("update organization_subscriptions set status='past_due'");
  assert.equal((await f.db.query("select * from claim_external_course_job($1,'modal-late')", [r.id])).rows.length, 0);
});
test('receipt RLS lets a tenant read its usage but hides it from another tenant', async t => {
  const f = await fixture(t, true); await f.authorize(); await f.prepare();
  await f.db.exec('grant usage on schema auth to authenticated; grant select on profiles to authenticated');
  await f.db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({role: 'authenticated', sub: actor})]);
  await f.db.exec('set role authenticated');
  assert.equal((await f.db.query('select id from external_course_executions')).rows.length, 1);
  await assert.rejects(f.db.exec("update external_course_executions set state='finished'"), /permission denied/);
  await f.db.exec('reset role');
  await f.db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({role: 'authenticated', sub: other})]);
  await f.db.exec('set role authenticated');
  assert.equal((await f.db.query('select id from external_course_executions')).rows.length, 0);
});
