// Isolated PostgreSQL verification. Never connects to a remote database.
import { fileURLToPath } from 'node:url';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.role() returns text language sql as $$ select current_setting('test.role',true) $$;
create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
create table public.user_app_subscriptions(user_id uuid not null, app_slug text not null, plan text, status text, trial_ends_at timestamptz,current_period_start timestamptz,current_period_end timestamptz,billing_provider text,provider_subscription_id text,updated_at timestamptz, unique(user_id,app_slug));
create table public.billing_invoices(id uuid primary key, status text,paid_at timestamptz,currency text,fulfillment_type text,fulfillment_payload jsonb,customer_external_key text,total_cents bigint,provider text);
set test.role='service_role';`);
const root = fileURLToPath(new URL('../', import.meta.url));
const wallets = readFileSync(
  root + 'supabase/migrations/20260810213000_website_builder_trial_credits.sql',
  'utf8',
);
await db.exec(
  wallets.slice(0, wallets.indexOf('create or replace function public.ensure_app_trial_wallet')),
);
await db.exec(
  readFileSync(root + 'supabase/migrations/20260811114500_harden_app_credit_rpcs.sql', 'utf8'),
);
await db.exec(
  `create table public.tenants(id uuid primary key); create table public.profiles(id uuid,tenant_id uuid);`,
);
await db.exec(
  readFileSync(
    root + 'supabase/migrations/20260825124500_tenant_course_builder_credits.sql',
    'utf8',
  ),
);
await db.exec(
  readFileSync(
    root + 'supabase/migrations/20261017063258_funded_website_builder_allowances.sql',
    'utf8',
  ),
);
await db.exec(readFileSync(root + 'supabase/migrations/20261017070802_commercial_ai_paid_allowances.sql','utf8'));
let checks = 0;
async function scalar(sql, params = []) {
  return Object.values((await db.query(sql, params)).rows[0])[0];
}
async function rejects(sql, params = []) {
  await assert.rejects(() => db.query(sql, params));
  checks++;
}
for (const [index, plan, amount, credits] of [
  [1, 'starter', 2900, 500],
  [2, 'professional', 7900, 2500],
  [3, 'enterprise', 19900, 10000],
]) {
  const user = `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
  const invoice = `10000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
  await db.query('insert into auth.users values($1)', [user]);
  await db.query(
    `insert into billing_invoices values($1,'open',now(),'USD','individual_app_subscription',$2::jsonb,$3,$4,'quickbooks')`,
    [
      invoice,
      JSON.stringify({
        user_id: user,
        app_slug: 'website-builder',
        plan_id: plan,
        amount_cents: amount,
      }),
      'user:' + user,
      amount,
    ],
  );
  await rejects('select activate_paid_website_builder_v1($1)', [invoice]);
  await db.query(`update billing_invoices set status='paid' where id=$1`, [invoice]);
  assert.equal(await scalar('select activate_paid_website_builder_v1($1)', [invoice]), true);
  checks++;
  let used = (
    await db.query(
      `select * from consume_website_builder_credits_v1($1,'initial_site_generation',3)`,
      [user],
    )
  ).rows[0];
  assert.deepEqual(used, { success: true, balance: credits - 180 });
  checks++;
  assert.equal(await scalar('select activate_paid_website_builder_v1($1)', [invoice]), false);
  checks++;
  assert.equal(
    await scalar('select balance from user_app_credit_wallets where user_id=$1', [user]),
    credits - 180,
  );
  checks++;
  await db.query(`update user_app_credit_wallets set balance=4 where user_id=$1`, [user]);
  used = (
    await db.query(`select * from consume_website_builder_credits_v1($1,'paris_edit')`, [user])
  ).rows[0];
  assert.equal(used.success, false);
  checks++;
  await db.query(`update user_app_credit_wallets set balance=500 where user_id=$1`, [user]);
  await db.query(
    `update user_app_subscriptions set current_period_end=now()-interval '1 second' where user_id=$1`,
    [user],
  );
  used = (
    await db.query(`select * from consume_website_builder_credits_v1($1,'paris_edit')`, [user])
  ).rows[0];
  assert.equal(used.success, false);
  checks++;
  await rejects(`select consume_website_builder_credits_v1($1,'paris_edit',3)`, [user]);
  await rejects(`select consume_website_builder_credits_v1($1,'bogus',1)`, [user]);
}
const courseUser = '00000000-0000-4000-8000-000000000001';
const tenant = '20000000-0000-4000-8000-000000000001';
await db.query('insert into tenants values($1)', [tenant]);
for (const [n, interval, amount, credits] of [
  [4, 'monthly', 10800, 2500],
  [5, 'annual', 123800, 30000],
]) {
  const invoice = `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  await db.query(
    `insert into billing_invoices values($1,'open',now(),'USD','platform_subscription',$2::jsonb,'organization:org',$3,'quickbooks')`,
    [
      invoice,
      JSON.stringify({
        tenant_id: tenant,
        organization_id: 'org',
        billing_interval: interval,
        addon_codes: ['course-creation-learning-platform'],
        amount_cents: amount,
      }),
      amount,
    ],
  );
  await rejects('select grant_course_builder_paid_invoice_v1($1)', [invoice]);
  await db.query(`update billing_invoices set status='paid' where id=$1`, [invoice]);
  const before = Number(
    await scalar(
      'select coalesce(sum(balance),0) from tenant_course_builder_credit_wallets where tenant_id=$1',
      [tenant],
    ),
  );
  assert.equal(await scalar('select grant_course_builder_paid_invoice_v1($1)', [invoice]), true);
  checks++;
  assert.equal(await scalar('select grant_course_builder_paid_invoice_v1($1)', [invoice]), false);
  checks++;
  assert.equal(
    await scalar('select balance from tenant_course_builder_credit_wallets where tenant_id=$1', [
      tenant,
    ]),
    before + credits,
  );
  checks++;
  const used = (
    await db.query(
      `select * from consume_tenant_course_builder_credits($1,$2,'course-creation-learning-platform','generate',1500,$3)`,
      [tenant, courseUser, 'course:' + n],
    )
  ).rows[0];
  assert.equal(used.applied, true);
  checks++;
  const duplicate = (
    await db.query(
      `select * from consume_tenant_course_builder_credits($1,$2,'course-creation-learning-platform','generate',1500,$3)`,
      [tenant, courseUser, 'course:' + n],
    )
  ).rows[0];
  assert.equal(duplicate.applied, false);
  checks++;
}
await db.query(
  `update tenant_course_builder_credit_wallets set current_period_end=now()-interval '1 second' where tenant_id=$1`,
  [tenant],
);
assert.equal(
  (
    await db.query(
      `select * from consume_tenant_course_builder_credits($1,$2,'course-creation-learning-platform','generate',1500,'after-expiry')`,
      [tenant, courseUser],
    )
  ).rows[0].success,
  false,
);
checks++;
// Assistant pools are invoice-backed, tenant-scoped, expiring and idempotent.
const aiTenant='20000000-0000-4000-8000-000000000002';
const otherTenant='20000000-0000-4000-8000-000000000003';
await db.query('insert into tenants values($1),($2)',[aiTenant,otherTenant]);
for(const [n,interval,addon,amount,allowance] of [[6,'monthly','paris-assistant',4800,250],[7,'annual','ai-team',123800,14400]]) {
 const invoice=`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
 await db.query(`insert into billing_invoices values($1,'open',now(),'USD','platform_subscription',$2::jsonb,'organization:org',$3,'quickbooks')`,[invoice,JSON.stringify({tenant_id:aiTenant,organization_id:'org',billing_interval:interval,addon_codes:[addon],amount_cents:amount}),amount]);
 await rejects('select grant_commercial_ai_paid_invoice_v1($1)',[invoice]);
 await db.query(`update billing_invoices set status='paid' where id=$1`,[invoice]);
 assert.equal(await scalar('select grant_commercial_ai_paid_invoice_v1($1)',[invoice]),true);checks++;
 assert.equal(await scalar('select grant_commercial_ai_paid_invoice_v1($1)',[invoice]),false);checks++;
 assert.equal(await scalar('select balance from commercial_ai_credit_periods where billing_invoice_id=$1',[invoice]),allowance);checks++;
}
let aiUsage=(await db.query(`select * from consume_commercial_ai_reply_v1($1,$2,'paris','reply-1')`,[aiTenant,courseUser])).rows[0];
assert.deepEqual(aiUsage,{success:true,duplicate:false,balance:14640});checks++;
aiUsage=(await db.query(`select * from consume_commercial_ai_reply_v1($1,$2,'paris','reply-1')`,[aiTenant,courseUser])).rows[0];
assert.equal(aiUsage.duplicate,true);checks++;
assert.equal(await scalar('select sum(balance)::integer from commercial_ai_credit_periods where tenant_id=$1',[aiTenant]),14640);checks++;
aiUsage=(await db.query(`select * from consume_commercial_ai_reply_v1($1,$2,'paris','other-tenant')`,[otherTenant,courseUser])).rows[0];
assert.equal(aiUsage.success,false);checks++;
await db.query('update commercial_ai_credit_periods set balance=5 where tenant_id=$1',[aiTenant]);
aiUsage=(await db.query(`select * from consume_commercial_ai_reply_v1($1,$2,'paris','split-debit')`,[aiTenant,courseUser])).rows[0];
assert.deepEqual(aiUsage,{success:true,duplicate:false,balance:0});checks++;
assert.equal(await scalar(`select jsonb_array_length(debits) from commercial_ai_credit_usage where tenant_id=$1 and idempotency_key='split-debit'`,[aiTenant]),2);checks++;
await db.query('update commercial_ai_credit_periods set balance=100 where tenant_id=$1',[aiTenant]);
await db.query(`update billing_invoices set status='void' where id in(select billing_invoice_id from commercial_ai_credit_periods where tenant_id=$1)`,[aiTenant]);
aiUsage=(await db.query(`select * from consume_commercial_ai_reply_v1($1,$2,'paris','void-invoices')`,[aiTenant,courseUser])).rows[0];
assert.equal(aiUsage.success,false);checks++;
await db.query(`update billing_invoices set status='paid' where id in(select billing_invoice_id from commercial_ai_credit_periods where tenant_id=$1)`,[aiTenant]);
await db.query(`update commercial_ai_credit_periods set period_start=now()-interval '2 months',period_end=now()-interval '1 month' where tenant_id=$1`,[aiTenant]);
aiUsage=(await db.query(`select * from consume_commercial_ai_reply_v1($1,$2,'paris','expired-invoices')`,[aiTenant,courseUser])).rows[0];
assert.equal(aiUsage.success,false);checks++;
await rejects(`select consume_commercial_ai_reply_v1($1,$2,'toString','bad-agent')`,[aiTenant,courseUser]);
assert.equal(await scalar(`select has_function_privilege('authenticated','public.consume_commercial_ai_reply_v1(uuid,uuid,text,text)','EXECUTE')`),false);checks++;
await db.exec(`set test.role='authenticated'`);
await rejects(`select activate_paid_website_builder_v1('10000000-0000-4000-8000-000000000001')`);
await rejects(
  `select consume_website_builder_credits_v1('00000000-0000-4000-8000-000000000001','paris_edit')`,
);
assert.equal(
  await scalar(
    `select has_function_privilege('authenticated','public.ensure_app_trial_wallet(uuid,text,integer)','EXECUTE')`,
  ),
  false,
);
checks++;
assert.equal(
  await scalar(
    `select has_function_privilege('authenticated','public.consume_app_credits(uuid,text,text,integer)','EXECUTE')`,
  ),
  false,
);
checks++;
assert.equal(
  await scalar(
    `select has_function_privilege('anon','public.activate_paid_website_builder_v1(uuid)','EXECUTE')`,
  ),
  false,
);
checks++;
await db.exec(`alter table user_app_subscriptions enable row level security;
create policy owner_insert on user_app_subscriptions for insert to authenticated with check(true);
grant usage on schema public to authenticated;
grant insert on user_app_subscriptions to authenticated;
set role authenticated;`);
await rejects(
  `insert into user_app_subscriptions(user_id,app_slug,status) values('00000000-0000-4000-8000-000000000001','website-builder','active')`,
);
await db.exec('reset role');
console.log(`${checks} PostgreSQL functional checks passed; isolated local database only.`);
await db.close();
