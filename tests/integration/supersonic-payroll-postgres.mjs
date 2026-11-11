import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();
try{
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
 create table auth.users(id uuid primary key); create table public.tax_offices(id uuid primary key,owner_id uuid,status text);
 insert into auth.users values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
 insert into tax_offices values('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','active');
 grant usage on schema public,auth to service_role; grant select on tax_offices to service_role;`);
 await db.exec(await readFile(new URL('../../supabase/migrations/20261111032104_supersonic_payroll_workspaces.sql',import.meta.url),'utf8'));
 // Hosted Supabase defaults grant ALL to service_role on newly created tables.
 // Reproduce that environment before applying the explicit narrowing migration.
 await db.exec('grant all on sfc_payroll_companies,sfc_payroll_runs,sfc_payroll_events to service_role');
 await db.exec(await readFile(new URL('../../supabase/migrations/20261111032208_supersonic_payroll_server_privileges.sql',import.meta.url),'utf8'));
 for(const table of ['sfc_payroll_companies','sfc_payroll_runs','sfc_payroll_events']){
  assert.equal((await db.query("select has_table_privilege('service_role',$1,'DELETE') allowed",[table])).rows[0].allowed,false);
 }
 assert.equal((await db.query("select has_table_privilege('service_role','sfc_payroll_events','UPDATE') allowed")).rows[0].allowed,false);
 const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',company='44444444-4444-4444-8444-444444444444',run='55555555-5555-4555-8555-555555555555';
 await db.exec('set role service_role');
 await db.query("insert into sfc_payroll_companies(id,office_id,legal_name,frequency) values($1,'33333333-3333-4333-8333-333333333333','Isolated fictional company','weekly')",[company]);
 const input={periodStart:'2026-11-01',periodEnd:'2026-11-07',payDate:'2026-11-13'},calculation={version:'sfc-periodic-IN-2026.1',paymentsSent:false,taxesFiled:false};
 const save=(actor=owner,version=1,expected=null,calc=calculation,id=run)=>db.query('select r.* from sfc_save_payroll_run($1,$2,$3,$4,$5,$6,$7) r',[actor,company,version,id,expected,JSON.stringify(input),JSON.stringify(calc)]);
 await assert.rejects(save(other),/ACCESS/);
 await assert.rejects(save(owner,2),/PROFILE_CHANGED/);
 await assert.rejects(save(owner,1,null,{...calculation,paymentsSent:true}),/INVALID/);
 await assert.rejects(save(owner,1,null,{paymentsSent:false,taxesFiled:false}),/INVALID/);
 assert.equal((await save()).rows[0].status,'draft');
 await assert.rejects(save(),/RUN_CHANGED/);
 await assert.rejects(save(owner,1,null,calculation,'66666666-6666-4666-8666-666666666666'),/unique/);
 assert.equal((await db.query('select count(*)::int n from sfc_payroll_runs')).rows[0].n,1,'failed duplicate insert rolls back');
 assert.equal((await db.query('select count(*)::int n from sfc_payroll_events')).rows[0].n,1,'duplicate never adds an event');
 const review=(actor=owner,version=1,action='approve')=>db.query('select r.* from sfc_review_payroll_run($1,$2,$3,$4,$5) r',[actor,company,run,version,action]);
 await assert.rejects(review(other),/ACCESS/);
 await db.query('update sfc_payroll_companies set version=2 where id=$1',[company]);
 await assert.rejects(review(),/PROFILE_CHANGED/);
 assert.equal((await save(owner,2,1)).rows[0].version,2,'draft can be recalculated against new profile');
 const approved=(await review(owner,2)).rows[0];
 assert.equal(approved.status,'approved_for_export');assert.equal(approved.calculation.paymentsSent,false);
 await assert.rejects(db.query("update sfc_payroll_runs set calculation='{}'::jsonb where id=$1",[run]),/IMMUTABLE/);
 await assert.rejects(save(owner,2,3),/RUN_CHANGED/);
 await assert.rejects(review(owner,2),/RUN_CHANGED/);
 await assert.rejects(db.exec('delete from sfc_payroll_events'),/permission denied/);
 await assert.rejects(db.exec("update sfc_payroll_events set action='voided'"),/permission denied/);
 assert.equal((await review(owner,3,'void')).rows[0].status,'voided');
 await assert.rejects(db.query("update sfc_payroll_runs set status='draft' where id=$1",[run]),/PERMANENT/);
 assert.equal((await db.query('select count(*)::int n from sfc_payroll_events')).rows[0].n,4);
 await db.exec('reset role; set role authenticated');
 await assert.rejects(db.exec('select * from sfc_payroll_runs'),/permission denied/);
 await assert.rejects(review(),/permission denied/);
 await db.exec('reset role');
 await db.exec("update tax_offices set status='suspended'");
 await db.exec('set role service_role');
 await assert.rejects(review(owner,4,'void'),/ACCESS/);
 console.log('PASS: owner isolation, suspended office, stale profile, duplicate period, concurrency, approval-only state, preserved audit and database permissions. No remote database or provider used.');
}finally{await db.close();}
