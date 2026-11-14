import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('license/provider RPCs enforce service access and preserve target, expiry and audit contracts', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create function auth.role() returns text language sql as $$ select current_setting('request.jwt.claims',true)::jsonb->>'role' $$;
      create table public.profiles(id uuid primary key,role text);
      create table public.tenants(id uuid primary key,status text,active boolean,updated_at timestamptz);
      create table public.programs(id uuid primary key,tenant_id uuid,published boolean,is_active boolean);
      create table public.licenses(id uuid primary key,tenant_id uuid,status text,canceled_at timestamptz,suspended_at timestamptz,suspended_reason text,current_period_end timestamptz,expires_at timestamptz,paid_through timestamptz,ends_at timestamptz,updated_at timestamptz);
      create table public.admin_audit_events(action text,actor_user_id uuid,target_type text,target_id text,metadata jsonb);
    `);
    await db.exec(readFileSync(new URL('../supabase/migrations/20261101002558_repair_integration_lifecycle_contracts.sql',import.meta.url),'utf8'));
    const actor='00000000-0000-4000-8000-000000000001', tenant='00000000-0000-4000-8000-000000000002';
    const first='00000000-0000-4000-8000-000000000003', second='00000000-0000-4000-8000-000000000004';
    await db.query('insert into profiles values ($1,$2)',[actor,'admin']);
    await db.query("insert into tenants values ($1,'active',true,now())",[tenant]);
    await db.query("insert into licenses(id,tenant_id,status,current_period_end) values($1,$3,'active',now()+interval '1 day'),($2,$3,'active',now()+interval '1 day')",[first,second,tenant]);
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:'authenticated'})]);
    await assert.rejects(db.query("select set_license_lifecycle($1,'suspend',$2,'test')",[first,actor]),/SERVICE_ROLE_REQUIRED/);
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:'service_role'})]);
    const call=async(sql,args)=>(await db.query(sql,args)).rows[0].result;
    assert.equal((await call("select set_license_lifecycle($1,'suspend',$2,'test') result",[first,actor])).success,true);
    assert.equal((await db.query('select status from licenses where id=$1',[second])).rows[0].status,'active');
    assert.equal((await call('select reactivate_license($1,$2) result',[first,actor])).success,true);
    await db.query("update licenses set current_period_end=now()-interval '1 day',status='suspended' where id=$1",[first]);
    assert.equal((await call('select reactivate_license($1,$2) result',[first,actor])).success,false);
    assert.equal((await call("select revoke_license($1,'test',$2) result",[second,actor])).success,true);
    assert.equal((await call('select reactivate_license($1,$2) result',[second,actor])).success,false);
    const audits=(await db.query('select * from admin_audit_events')).rows;
    assert.equal(audits.length,3);
    assert.ok(audits.every(row=>row.actor_user_id===actor));
    const grants=(await db.query("select has_function_privilege('anon','public.reactivate_license(uuid,uuid)','EXECUTE') anon,has_function_privilege('authenticated','public.reactivate_license(uuid,uuid)','EXECUTE') authenticated")).rows[0];
    assert.deepEqual(grants,{anon:false,authenticated:false});
    assert.equal((await call("select suspend_provider($1,$2,'test') result",[tenant,actor])).success,true);
    assert.equal((await db.query('select active from tenants where id=$1',[tenant])).rows[0].active,false);
  } finally { await db.close(); }
});
