import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
test('verified QuickBooks recovery atomically binds credentials and preserves newer consent',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create table app_settings(key text primary key,value text not null,updated_at timestamptz not null default now());
 create table secret_fixture(key text primary key,value text);
 create function set_platform_secret(p_key text,p_value text,p_description text,p_category text) returns void language sql as $$ insert into secret_fixture values(p_key,p_value) on conflict(key) do update set value=excluded.value $$;
 insert into app_settings(key,value) values('QB_REFRESH_TOKEN','old'),('QB_REALM_ID','123');`);
 await db.exec(readFileSync(new URL('../supabase/migrations/20261101024715_bind_verified_quickbooks_authorization.sql',import.meta.url),'utf8'));
 const tokens=JSON.stringify({access_token:'access',refresh_token:'new',expires_in:3600});
 const save=async expected=>(await db.query('select save_verified_quickbooks_authorization($1,$2,$3,$4,$5) as saved',[expected,'client','secret','123',tokens])).rows[0].saved;
 assert.equal(await save('stale'),false);assert.equal((await db.query('select count(*)::int as count from secret_fixture')).rows[0].count,0);
 assert.equal(await save('old'),true);assert.equal(await save('old'),false);
 assert.equal((await db.query("select value from app_settings where key='QB_REFRESH_TOKEN'")).rows[0].value,'new');
 assert.equal((await db.query("select value from secret_fixture where key='QB_CLIENT_ID'")).rows[0].value,'client');
 assert.equal((await db.query("select has_function_privilege('authenticated','save_verified_quickbooks_authorization(text,text,text,text,jsonb)','execute') as allowed")).rows[0].allowed,false);
 await db.exec("create or replace function set_platform_secret(p_key text,p_value text,p_description text,p_category text) returns void language plpgsql as $$begin if p_key='QB_CLIENT_SECRET' then raise exception 'storage failure';end if;insert into secret_fixture values(p_key,p_value) on conflict(key) do update set value=excluded.value;end$$;");
 await assert.rejects(()=>db.query('select save_verified_quickbooks_authorization($1,$2,$3,$4,$5)',['new','replacement','replacement-secret','123',tokens]));
 assert.equal((await db.query("select value from secret_fixture where key='QB_CLIENT_ID'")).rows[0].value,'client');
 }finally{await db.close();}
});
