import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
test('theory reports use confirmed schedules, distinguish pending evidence and deduplicate notices', async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
   create function auth.role() returns text language sql as $$ select current_setting('request.jwt.claims',true)::jsonb->>'role' $$;
   create table auth.users(id uuid primary key);
   create table public.program_enrollments(id uuid primary key,user_id uuid,program_slug text,status text);
   create table public.reporting_verdicts(id uuid primary key default gen_random_uuid(),name text,data jsonb,period text,created_at timestamptz default now(),updated_at timestamptz default now());
   create table public.apprenticeship_theory_schedules(id uuid,user_id uuid,program_slug text,active boolean,learner_confirmed_at timestamptz,starts_on date,updated_at timestamptz,timezone text,end_time time,days_of_week integer[],weekly_target_minutes integer);
   create table public.apprenticeship_rti_entries(enrollment_id uuid,instruction_date date,status text,minutes_verified integer,minutes_claimed integer);
   create table public.notifications(user_id uuid,type text,title text,message text,action_url text,idempotency_key text,metadata jsonb,read boolean default false);
  `);
  await db.exec(readFileSync(new URL('../supabase/migrations/20261101003300_restore_canonical_theory_reporting.sql',import.meta.url),'utf8'));
  const user='00000000-0000-4000-8000-000000000001',enrollment='00000000-0000-4000-8000-000000000002';
  await db.query('insert into auth.users values($1)',[user]);
  await db.query("insert into program_enrollments values($1,$2,'barber','active')",[enrollment,user]);
  await db.query("insert into apprenticeship_theory_schedules values(gen_random_uuid(),$1,'barber',true,now(),'2026-01-01',now(),'America/Indiana/Indianapolis','19:00',ARRAY[1,2,3,4],180)",[user]);
  await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:'service_role'})]);
  const report=async()=> (await db.query("select * from generate_reporting_verdicts('2026-01-05','2026-01-11')")).rows[0];
  assert.equal((await report()).no_activity,1);await report();
  assert.equal((await db.query('select count(*)::int as count from notifications')).rows[0].count,1);
  await db.query("insert into apprenticeship_rti_entries values($1,'2026-01-05','submitted',null,180)",[enrollment]);
  assert.equal((await report()).no_activity,0);
  assert.equal((await db.query('select status from reporting_verdicts')).rows[0].status,'PENDING_VERIFICATION');
  await db.query("update apprenticeship_rti_entries set status='verified',minutes_verified=180");
  assert.equal((await report()).on_track,1);
  assert.equal((await db.query('select read from notifications')).rows[0].read,true);
  await db.query('update apprenticeship_theory_schedules set learner_confirmed_at=null');
  await report();
  assert.equal((await db.query('select status from reporting_verdicts')).rows[0].status,'NO_SCHEDULE');
  await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:'authenticated'})]);
  await assert.rejects(report(),/SERVICE_ROLE_REQUIRED/);
 } finally {await db.close();}
});
