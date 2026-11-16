import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
const run=promisify(execFile);
const root=new URL('../',import.meta.url);
let db;
if(process.env.WEBSITE_ATOMIC_TEST_DATABASE_URL){
 const url=process.env.WEBSITE_ATOMIC_TEST_DATABASE_URL;
 if(!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('Only isolated loopback databases are allowed');
 const args=[url,'-q','-X','-v','ON_ERROR_STOP=1','-At'];
 db={exec:async sql=>(await run('psql',[...args,'-c',sql],{maxBuffer:200000,timeout:30000})).stdout.trim()};
 db.overlap=async(firstSQL,secondSQL)=>{
  const applicationName='website_atomic_wait_'+Date.now();
  const first=spawn('psql',args,{stdio:['pipe','pipe','pipe']});
  let output='',errors='',exited=false;
  first.stdout.on('data',chunk=>{output+=chunk});
  first.stderr.on('data',chunk=>{errors+=chunk});
  const completed=new Promise(resolve=>{
   first.on('error',error=>{exited=true;resolve({code:-1,error})});
   first.on('close',code=>{exited=true;resolve({code})});
  });
  const until=async(condition,label)=>{
   const deadline=Date.now()+20000;
   while(!await condition()){
    if(Date.now()>deadline)throw Error('Timed out waiting for '+label);
    await new Promise(resolve=>setTimeout(resolve,25));
   }
  };
  try{
   // Keep the first successful commit uncommitted at the SQL transaction level.
   first.stdin.write("begin;\n"+firstSQL+"\nselect pg_backend_pid(); select 'FIRST_LOCKED';\n");
   await until(()=>{
    if(exited&&!output.includes('FIRST_LOCKED'))throw Error('First transaction failed: '+errors);
    return output.includes('FIRST_LOCKED');
   },'first transaction locks');
   const pid=output.split(/\r?\n/).find(line=>/^\d+$/.test(line));
   assert.ok(pid,'first backend PID must be observed');
   const second=run('psql',[...args,'-c',secondSQL],{maxBuffer:200000,timeout:30000,
    env:{...process.env,PGAPPNAME:applicationName}}).then(
     result=>({status:'fulfilled',value:result.stdout.trim()}),
     reason=>({status:'rejected',reason}));
   await until(async()=>await db.exec(`select count(*) from pg_stat_activity where application_name='${applicationName}' and wait_event_type='Lock' and ${pid}=any(pg_blocking_pids(pid));`)==='1','second transaction blocked by first');
   console.log('Confirmed second PostgreSQL session blocked by first before release.');
   first.stdin.end('commit;\n');
   const result=await completed;
   assert.equal(result.code,0,errors);
   const receipt=output.split(/\r?\n/).find(line=>line.startsWith('{'));
   assert.ok(receipt,'first transaction receipt must be returned');
   return [{status:'fulfilled',value:receipt},await second];
  }finally{
   if(!exited){first.stdin.end('rollback;\n');first.kill('SIGTERM');}
  }
 };
}else{
 // Optional local WASM PostgreSQL engine; CI uses two real PostgreSQL sessions.
 const {PGlite}=await import(process.env.WEBSITE_ATOMIC_PGLITE_MODULE || '@electric-sql/pglite');
 const pg=new PGlite();db={exec:async sql=>{const rs=await pg.exec(sql);const value=Object.values(rs.findLast(r=>r.rows.length)?.rows[0]||{})[0];return value && typeof value==='object' ? JSON.stringify(value) : String(value??'');},close:()=>pg.close()};
}
const owner='00000000-0000-4000-8000-000000000002';
const site='00000000-0000-4000-8000-000000000001';
const other='00000000-0000-4000-8000-000000000003';
const req=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const call=(n,{id=null,stamp=null,plan='starter',charge=true,operation='initial_site_generation',actor=owner,name='Draft'}={})=>
 `set role service_role;select public.commit_website_builder_draft('${req(n)}','${actor}',${id?`'${id}'`:'null'},${stamp?`'${stamp}'`:'null'},'${name}','executive','{"meta":{"parisInterviewCompleted":true}}','${plan}','${operation}',${charge});reset role;`;
const scalar=sql=>db.exec('reset role;'+sql);
const fails=async(sql,pattern)=>{await assert.rejects(()=>db.exec(sql),pattern);await db.exec('reset role');};
try {
 const fixture = await readFile(new URL('tests/database/fixtures/website-builder-atomic.sql',root),'utf8');
 await db.exec(fixture.replace(/create role (anon|authenticated|service_role)( bypassrls)?;/g, (_,role,options='') => `do $$ begin if not exists(select from pg_roles where rolname='${role}') then create role ${role}${options}; end if; end $$;`));
 await db.exec(`alter table user_websites alter column id set default gen_random_uuid();
 alter table user_websites alter column updated_at set default now();
 alter table user_websites add column template_id text, add column status text;
 grant insert on user_websites to service_role;delete from user_websites;
 update user_app_credit_wallets set balance=180;`);
 await db.exec(await readFile(new URL('supabase/migrations/20261116201202_website_builder_atomic_edits.sql',root),'utf8'));
 await db.exec(await readFile(new URL('supabase/migrations/20261116221156_website_builder_atomic_generation.sql',root),'utf8'));
 const first=await db.exec(call(1));const saved=JSON.parse(first).website;
 assert.equal(await scalar('select balance from user_app_credit_wallets'),'120');
 assert.equal(await db.exec(call(1)),first);
 assert.equal(await scalar('select count(*) from user_app_credit_ledger'),'1');
 await fails(call(1,{name:'Changed'}),/Request identifier/);
 await fails(call(2),/plan limit/);
 assert.equal(await scalar('select balance from user_app_credit_wallets'),'120');
 await fails(call(3,{id:saved.id,stamp:saved.updated_at,actor:other}),/Website not found/);
 // The save token is changed by an unrelated writer while generation runs.
 await scalar(`update user_websites set site_name='Intervening' where id='${saved.id}'`);
 await fails(call(4,{id:saved.id,stamp:saved.updated_at}),/Website changed/);
 assert.equal(await scalar('select count(*) from website_revisions'),'0');
 let stamp=await scalar(`select updated_at::text from user_websites where id='${saved.id}'`);
 await scalar(`create function reject_draft() returns trigger language plpgsql as $$begin raise exception 'forced write failure';end$$;
 create trigger reject_draft before update on user_websites for each row execute function reject_draft();`);
 await fails(call(5,{id:saved.id,stamp}),/forced write failure/);
 assert.equal(await scalar('select balance from user_app_credit_wallets'),'120');
 assert.equal(await scalar('select count(*) from website_revisions'),'0');
 assert.equal(await scalar('select count(*) from website_builder_edit_commits'),'1');
 await scalar('drop trigger reject_draft on user_websites');
 const imported=JSON.parse(await db.exec(call(6,{id:saved.id,stamp,charge:false,operation:'import'})));
 assert.ok(imported.backupRevisionId);assert.equal(imported.creditsCharged,0);
 assert.equal(await scalar('select balance from user_app_credit_wallets'),'120');
 await fails(call(7,{id:saved.id,stamp}),/Website changed/);
 await fails(call(8,{charge:true,operation:'import'}),/Invalid draft commit/);
 await scalar(`create trigger reject_draft before insert on user_websites for each row execute function reject_draft();`);
 await fails(call(9,{plan:'enterprise'}),/forced write failure/);
 assert.equal(await scalar('select balance from user_app_credit_wallets'),'120');
 await scalar('drop trigger reject_draft on user_websites');
 await scalar(`create trigger reject_snapshot before insert on website_revisions for each row execute function reject_draft();`);
 stamp=await scalar('select updated_at::text from user_websites');
 await fails(call(10,{id:saved.id,stamp}),/forced write failure/);
 assert.equal(await scalar('select balance from user_app_credit_wallets'),'120');
 await scalar('drop trigger reject_snapshot on website_revisions');
 await scalar('update user_app_credit_wallets set balance=1');
 await fails(call(11,{plan:'enterprise'}),/Insufficient/);
 assert.equal(await scalar('select count(*) from user_websites'),'1');
 // Paid subscriptions retain unlimited enterprise creation and no trial debit.
 await db.exec(call(12,{plan:'enterprise',charge:false}));
 await db.exec(call(13,{plan:'enterprise',charge:false}));
 assert.equal(await scalar('select count(*) from user_websites'),'3');
 assert.equal(await scalar('select balance from user_app_credit_wallets'),'1');
 for(const role of ['anon','authenticated']) await fails(`set role ${role};select public.commit_website_builder_draft(null,null,null,null,null,null,null,null,null,null);`,/permission denied/);
 // Two separate sessions must overlap while the owner and request locks are held.
 await scalar('delete from user_websites; update user_app_credit_wallets set balance=180;');
 if(db.overlap) {
  const results=await db.overlap(call(20),call(21));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1,'plan limit allows only one simultaneous creation');
  assert.equal(await scalar('select count(*) from user_websites'),'1');
  assert.equal(await scalar('select balance from user_app_credit_wallets'),'120');
  await scalar('delete from user_websites');
  const duplicate=await db.overlap(call(22),call(22));
  assert.equal(duplicate.filter(r=>r.status==='fulfilled').length,2);
  assert.deepEqual(JSON.parse(duplicate[0].value),JSON.parse(duplicate[1].value));
  assert.equal(await scalar('select count(*) from user_websites'),'1');
  assert.equal(await scalar('select balance from user_app_credit_wallets'),'60');
  const target=JSON.parse(duplicate[0].value).website;
  const backupsBefore=Number(await scalar('select count(*) from website_revisions'));
  const stale=await db.overlap(call(23,{id:target.id,stamp:target.updated_at,operation:'import',charge:false}),call(24,{id:target.id,stamp:target.updated_at}));
  assert.equal(stale.filter(r=>r.status==='fulfilled').length,1,'stale concurrent generation must not replace import');
  assert.equal(await scalar('select balance from user_app_credit_wallets'),'60','stale generation cannot debit');
  assert.equal(await scalar('select count(*) from website_revisions'),String(backupsBefore+1),'only the committed import creates its backup');
 }else {
  await db.exec(call(20));await fails(call(21),/plan limit/);
 }
 console.log('Atomic draft SQL: ownership, version, plan, rollback, debit, replay and role denial passed'+(db.overlap?'; forced overlapping sessions passed.':'.'));
}finally {await db.close?.();}
