import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run=promisify(execFile);
const root=new URL('../',import.meta.url);
let db;
if(process.env.WEBSITE_ATOMIC_TEST_DATABASE_URL){
 const url=process.env.WEBSITE_ATOMIC_TEST_DATABASE_URL;
 if(!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('Only isolated loopback databases are allowed');
 db={exec:async sql=>(await run('psql',[url,'-q','-X','-v','ON_ERROR_STOP=1','-At','-c',sql],{maxBuffer:200000})).stdout.trim()};
}else{
 // Optional local WASM PostgreSQL engine; CI uses two real PostgreSQL sessions.
 const {PGlite}=await import(process.env.WEBSITE_ATOMIC_PGLITE_MODULE || '@electric-sql/pglite');
 const pg=new PGlite();db={exec:async sql=>{const rs=await pg.exec(sql);const value=Object.values(rs.findLast(r=>r.rows.length)?.rows[0]||{})[0];return value && typeof value==='object' ? JSON.stringify(value) : String(value??'');},close:()=>pg.close()};
}
const owner='00000000-0000-4000-8000-000000000002',site='00000000-0000-4000-8000-000000000001';
const old='2099-01-01T00:00:00.123Z';
const request=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const commit=(id,stamp=old,name='After',charge=true)=>`set role service_role; select public.commit_website_builder_paris_edit('${request(id)}','${site}','${owner}',${stamp===null?'null':`'${stamp}'`},'${name}','{"title":"${name}"}',${charge}); reset role;`;
const scalar=sql=>db.exec(`reset role;${sql}`);
async function fails(sql,pattern){await assert.rejects(()=>db.exec(sql),pattern);await db.exec('reset role');}
try{
 await db.exec(await readFile(new URL('tests/database/fixtures/website-builder-atomic.sql',root),'utf8'));
 await db.exec(await readFile(new URL('supabase/migrations/20261116201202_website_builder_atomic_edits.sql',root),'utf8'));
 const before=await scalar('select md5(row_to_json(w)::text) from user_websites w');
 const first=await db.exec(commit(10));
 assert.equal(await scalar('select balance from user_app_credit_wallets'), '8');
 assert.equal(await scalar('select count(*) from website_revisions'),'1');
 assert.equal(await scalar('select count(*) from user_app_credit_ledger'),'1');
 assert.equal(await db.exec(commit(10)),first,'duplicate delivery returns identical receipt');
 assert.equal(await scalar('select balance from user_app_credit_wallets'),'8');
 await fails(commit(10,old,'Different'),/Request identifier/);
 await fails(commit(11),/Website changed/);
 assert.equal(await scalar('select balance from user_app_credit_wallets'),'8','conflict does not debit');
 assert.equal(await scalar('select count(*) from website_revisions'),'1','conflict rolls back snapshot');
 assert.notEqual(await scalar('select md5(row_to_json(w)::text) from user_websites w'),before);
 assert.equal(await scalar(`select (updated_at>'${old}'::timestamptz)::int from user_websites`),'1','future/same millisecond token strictly advances');
 await scalar(`update user_websites set updated_at='${old}';`);
 assert.equal(await scalar(`select (updated_at>'${old}'::timestamptz+interval '1 microsecond')::int from user_websites`),'1','every writer advances token');
 let stamp=await scalar('select updated_at::text from user_websites');
 await scalar("create function reject_edit() returns trigger language plpgsql as $$begin raise exception 'forced write failure';end$$; create trigger reject_edit before update on user_websites for each row execute function reject_edit();");
 await fails(commit(12,stamp),/forced write failure/);
 assert.equal(await scalar('select balance from user_app_credit_wallets'),'8');
 assert.equal(await scalar('select count(*) from website_revisions'),'1');
 assert.equal(await scalar('select count(*) from website_builder_edit_commits'),'1');
 await scalar('drop trigger reject_edit on user_websites;');
 await scalar('update user_app_credit_wallets set balance=0;');
 await fails(commit(13,stamp),/Insufficient/);
 assert.equal(await scalar('select count(*) from website_revisions'),'1');
 await db.exec(commit(14,stamp,'Paid',false));
 assert.equal(await scalar('select count(*) from user_app_credit_ledger'),'1','paid edit makes no trial debit');
 await fails(`set role authenticated;select public.commit_website_builder_paris_edit('${request(15)}','${site}','${owner}',null,'x','{}',false);`,/permission denied/);
 await fails('set role anon;select * from website_builder_edit_commits;',/permission denied/);
 // Two overlapping requests, same snapshot, only one can commit/debit.
 await scalar('update user_app_credit_wallets set balance=16;update user_websites set updated_at=now();');
 stamp=await scalar('select updated_at::text from user_websites');
 const results=await Promise.allSettled([db.exec(commit(20,stamp,'WinnerA')),db.exec(commit(21,stamp,'WinnerB'))]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(await scalar('select balance from user_app_credit_wallets'),'8');
 // Duplicate requests in flight serialize to the same receipt without a second debit.
 stamp=await scalar('select updated_at::text from user_websites');
 const duplicate=await Promise.all([db.exec(commit(30,stamp,'Duplicate')),db.exec(commit(30,stamp,'Duplicate'))]);
 assert.equal(duplicate[0],duplicate[1]);
 assert.equal(await scalar('select balance from user_app_credit_wallets'),'0');
 console.log('Atomic website edit SQL: rollback, credits, replay, role denial and concurrent writes passed.');
}finally{await db.close?.();}
