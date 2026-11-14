import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('runtime probes preserve component identity, write receipts, never certify delivery and restrict execution', async () => {
 const db = new PGlite();
 try {
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create table app_settings(key text primary key,value text,updated_at timestamptz);
 create table platform_integrations(id uuid default gen_random_uuid(),tenant_id uuid,integration_name text,integration_type text,provider text,status text,is_enabled boolean,config jsonb,metadata jsonb,updated_at timestamptz);
 create table integration_configs(id uuid default gen_random_uuid(),integration_key text,config jsonb,enabled boolean,updated_at timestamptz);
 create table integration_sync_log(provider text,action text,status text,records jsonb,created_at timestamptz);
 create table platform_services(service_name text,tenant_id uuid,url text,provider text,status text,last_health_check timestamptz,updated_at timestamptz,metadata jsonb);
 create table email_logs(id uuid primary key,status text,metadata jsonb,updated_at timestamptz);
 create table email_delivery_events(email_log_id uuid references email_logs(id),provider text,provider_event_id text,provider_message_id text,event_type text,occurred_at timestamptz,payload jsonb);
 create unique index events_key on email_delivery_events(provider_event_id) where provider_event_id is not null;
 insert into platform_services(service_name,provider,status) values('Admin Portal','northflank','healthy');`);
 await db.exec(readFileSync(new URL('../supabase/migrations/20261101122228_connect_runtime_integration_evidence.sql',import.meta.url),'utf8'));
 const probe=(component,configured,authenticated)=>db.query("select record_runtime_integration_probe('supabase',$1,$2,$3,'authentication_verified',null)",[component,configured,authenticated]);
 await probe('admin',true,true);await probe('admin',true,true);await probe('marketing',false,false);
 assert.equal((await db.query('select count(*)::int n from platform_integrations')).rows[0].n,2);
 assert.equal((await db.query('select count(*)::int n from integration_sync_log')).rows[0].n,3);
 const rows=(await db.query('select * from platform_integrations')).rows;
 assert.equal(rows.find(r=>r.integration_type==='admin').status,'connected');
 assert.ok(rows.every(r=>r.metadata.delivery_verified===false));
 assert.equal((await db.query('select provider,status,last_health_check from platform_services')).rows[0].status,'unknown');
 await assert.rejects(probe('admin',false,true),/INVALID_INTEGRATION_PROBE/);
 const permissions=(await db.query("select has_function_privilege('authenticated','record_runtime_integration_probe(text,text,boolean,boolean,text,text)','execute') allowed")).rows[0];
 assert.equal(permissions.allowed,false);
 await db.exec("insert into app_settings values('QB_REFRESH_TOKEN','old',now()),('QB_REALM_ID','123',now())");
 assert.equal((await db.query("select rotate_quickbooks_authorization('old','123','access','new') saved")).rows[0].saved,true);
 assert.equal((await db.query("select rotate_quickbooks_authorization('old','123','stale-access','stale-refresh') saved")).rows[0].saved,false);
 assert.equal((await db.query("select value from app_settings where key='QB_REFRESH_TOKEN'")).rows[0].value,'new');
 const id='00000000-0000-4000-8000-000000000001';
 await db.query("insert into email_logs(id,status) values($1,'accepted')",[id]);
 const delivery=(eventId,event)=>db.query('select record_sendgrid_delivery_event($1,$2,null,$3,now()) saved',[id,eventId,event]);
 await delivery('delivered-one','delivered');await delivery('delivered-one','delivered');await delivery('processed-late','processed');
 assert.equal((await db.query('select count(*)::int n from email_delivery_events')).rows[0].n,2);
 const email=(await db.query('select * from email_logs')).rows[0];
 assert.equal(email.status,'delivered');assert.ok(email.metadata.delivered_at);
 const missing=(await db.query("select record_sendgrid_delivery_event('00000000-0000-4000-8000-000000000002','missing',null,'delivered',now()) saved")).rows[0];
 assert.equal(missing.saved,false);
 assert.equal((await db.query("select has_function_privilege('anon','record_sendgrid_delivery_event(uuid,text,text,text,timestamptz)','execute') allowed")).rows[0].allowed,false);
 } finally {await db.close();}
});
