import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
test('production application changes atomically invalidate old grants and preserve matching consent',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create table app_settings(key text primary key,value text not null,updated_at timestamptz not null default now());
 create table secret_fixture(key text primary key,value text);
 create function get_platform_secret(p_key text) returns text language sql as $$select value from secret_fixture where key=p_key$$;
 create function set_platform_secret(p_key text,p_value text,p_description text,p_category text) returns void language sql as $$insert into secret_fixture values(p_key,p_value) on conflict(key) do update set value=excluded.value$$;
 insert into app_settings(key,value) values('QB_ACCESS_TOKEN','old-access'),('QB_REFRESH_TOKEN','old-refresh');`);
 await db.exec(readFileSync(new URL('../supabase/migrations/20261101134851_configure_quickbooks_production_application.sql',import.meta.url),'utf8'));
 const params=['productionClient1234567890','productionSecret1234567890','https://www.elevateforhumanity.org/api/auth/quickbooks/callback'];
 const configure=async p=>(await db.query('select configure_quickbooks_oauth_application($1,$2,$3) as changed',p)).rows[0].changed;
 assert.equal(await configure(params),true);
 assert.equal((await db.query("select count(*)::int as n from app_settings where key in ('QB_ACCESS_TOKEN','QB_REFRESH_TOKEN')")).rows[0].n,0);
 await db.exec("insert into app_settings(key,value) values('QB_REFRESH_TOKEN','new-consent')");
 assert.equal(await configure(params),false);
 assert.equal((await db.query("select value from app_settings where key='QB_REFRESH_TOKEN'")).rows[0].value,'new-consent');
 assert.equal((await db.query("select has_function_privilege('authenticated','configure_quickbooks_oauth_application(text,text,text)','execute') as allowed")).rows[0].allowed,false);
 await assert.rejects(()=>configure([...params.slice(0,2),'https://other.example/callback']));
 await db.exec("create or replace function set_platform_secret(p_key text,p_value text,p_description text,p_category text) returns void language plpgsql as $$begin if p_key='QB_CLIENT_SECRET' then raise exception 'storage failure';end if;insert into secret_fixture values(p_key,p_value) on conflict(key) do update set value=excluded.value;end$$;");
 await assert.rejects(()=>configure(['replacementClient1234567890',params[1],params[2]]));
 assert.equal((await db.query("select value from secret_fixture where key='QB_CLIENT_ID'")).rows[0].value,params[0]);
 assert.equal((await db.query("select value from app_settings where key='QB_REFRESH_TOKEN'")).rows[0].value,'new-consent');
 }finally{await db.close();}
});
