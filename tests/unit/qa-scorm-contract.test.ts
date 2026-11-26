// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JOB_READY_MODULES, jobReadyProgress, jobReadyStatus } from '@/lib/career/job-ready';

const sql = readFileSync('scripts/qa/20261124183454_restore_isolated_qa_scorm_contract.sql', 'utf8');
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const admin = '33333333-3333-4333-8333-333333333333';
const tenant = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const otherTenant = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const first = JOB_READY_MODULES[0].id;

// Only the pre-existing Supabase identity helpers are modeled. The schema,
// grants, RLS policies, FK constraints, seed and Postgres operations are real.
const bootstrap = `
  create role anon;
  create role authenticated;
  create role service_role bypassrls;
  create schema auth;
  create schema private;
  create schema rpc_private;
  create schema security_private;
  create table public.tenants(id uuid primary key, slug text);
  create table public.profiles(id uuid primary key, role text, tenant_id uuid);
  create table public.courses(id uuid primary key);
  create table private.qa_environment_identity(project_ref text primary key);
  insert into private.qa_environment_identity values ('isdgjcdabhxxozarmxta');
  insert into public.tenants values ('${tenant}','elevate-lms-qa');
  insert into public.profiles values
    ('${owner}','student','${tenant}'),('${other}','student','${otherTenant}'),
    ('${admin}','admin','${tenant}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  create function rpc_private.is_super_admin() returns boolean language sql stable as
    $$ select coalesce(current_setting('qa.role',true)='super_admin',false) $$;
  create function rpc_private.is_admin() returns boolean language sql stable as
    $$ select coalesce(current_setting('qa.role',true) in ('admin','super_admin'),false) $$;
  create function rpc_private.get_current_tenant_id() returns uuid language sql stable as
    $$ select nullif(current_setting('qa.tenant',true),'')::uuid $$;
  create function security_private.privileged_session_mfa_satisfied() returns boolean language sql stable as
    $$ select auth.uid() is not null and
      (not rpc_private.is_admin() or current_setting('qa.aal',true)='aal2') $$;
  grant usage on schema auth,rpc_private,security_private to authenticated,anon,service_role;
  grant select on public.profiles to authenticated;
`;

let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(bootstrap);
  await db.exec(sql);
  await db.exec(`insert into public.scorm_enrollments(scorm_package_id,user_id,status,cmi_data)
    values ('${first}','${owner}','in_progress','{"cmi.location":"owner-page"}'),
           ('${first}','${other}','in_progress','{"cmi.location":"other-page"}');`);
}, 20000);
afterAll(async () => { await db?.close(); });

async function asUser<T>(work: () => Promise<T>, options: {
  user?: string; role?: string; aal?: string; tenantId?: string; databaseRole?: string;
} = {}) {
  await db.exec('begin');
  try {
    await db.query(`select set_config('request.jwt.claim.sub',$1,true),
      set_config('qa.role',$2,true),set_config('qa.aal',$3,true),set_config('qa.tenant',$4,true)`,
    [options.user ?? owner, options.role ?? 'student', options.aal ?? 'aal1', options.tenantId ?? tenant]);
    const role = options.databaseRole ?? 'authenticated';
    if (!['authenticated','anon','service_role'].includes(role)) throw new Error('Unsupported test role');
    await db.exec(`set local role ${role}`);
    return await work();
  } finally {
    await db.exec('rollback');
  }
}

describe('isolated QA SCORM contract', () => {
  it('installs the actual seven learner packages with their canonical dispatch paths', async () => {
    await asUser(async () => {
      const result = await db.query<{id:string; launch_url:string; status:string; active:boolean}>(
        'select id,launch_url,status,active from public.scorm_packages order by id');
      expect(result.rows).toEqual(JOB_READY_MODULES.map(module => ({
        id: module.id, launch_url: `/lms/career/job-ready/${module.slug}`, status:'published',active:true,
      })));
    });
  });

  it('saves and reopens the actual Job Ready progress fields with conflict-safe initialization', async () => {
    await asUser(async () => {
      const id = JOB_READY_MODULES[1].id;
      const cmi = { 'cmi.location':'lesson-3', 'cmi.comments_from_learner.0.comment':'QA saved state', 'cmi.progress_measure':'0.4' };
      const insert = `insert into public.scorm_enrollments(scorm_package_id,user_id,status)
        values ($1,$2,'not_attempted') on conflict(scorm_package_id,user_id) do nothing`;
      await db.query(insert,[id,owner]);
      await db.query(insert,[id,owner]);
      await db.query(`update public.scorm_enrollments set status=$1,progress_percentage=$2,cmi_data=$3,
        score=null,time_spent_seconds=17,last_accessed_at=now(),updated_at=now()
        where scorm_package_id=$4 and user_id=$5 and status not in ('completed','passed')`,
      [jobReadyStatus(cmi),jobReadyProgress(cmi),JSON.stringify(cmi),id,owner]);
      const saved = await db.query('select status,progress_percentage,cmi_data,time_spent_seconds from public.scorm_enrollments where scorm_package_id=$1',[id]);
      expect(saved.rows).toEqual([{status:'in_progress',progress_percentage:'40',cmi_data:cmi,time_spent_seconds:17}]);
    });
  });

  it('reads only the signed-in learner progress even without an application-side user filter', async () => {
    await asUser(async () => {
      const result = await db.query('select user_id,cmi_data from public.scorm_enrollments');
      expect(result.rows).toEqual([{user_id:owner,cmi_data:{'cmi.location':'owner-page'}}]);
    });
  });

  it('refuses inserting a progress row for another learner', async () => {
    await expect(asUser(() => db.query('insert into public.scorm_enrollments(scorm_package_id,user_id) values ($1,$2)',
      [JOB_READY_MODULES[2].id,other]))).rejects.toMatchObject({code:'42501'});
  });

  it('cannot update another learner progress', async () => {
    await asUser(async () => {
      const result = await db.query('update public.scorm_enrollments set status=$1 where user_id=$2 returning id',['completed',other]);
      expect(result.rows).toEqual([]);
    });
  });

  it('cannot transfer ownership of an existing progress row', async () => {
    await expect(asUser(() => db.query('update public.scorm_enrollments set user_id=$1 where user_id=$2',[other,owner])))
      .rejects.toMatchObject({code:'42501'});
  });

  it.each([
    'insert into public.scorm_packages(title,package_url,launch_url) values (\'Unauthorized\',\'/x\',\'/x\')',
    'update public.scorm_packages set active=false',
    'delete from public.scorm_enrollments',
    'select * from public.scorm_tracking',
  ])('keeps package mutation, deletion and tracking outside learner privileges: %s', async query => {
    await expect(asUser(() => db.exec(query))).rejects.toMatchObject({code:'42501'});
  });

  it.each(['scorm_packages','scorm_enrollments','scorm_tracking'])('does not expose %s to anonymous requests', async table => {
    await expect(asUser(() => db.query(`select * from public.${table}`),{databaseRole:'anon',user:''}))
      .rejects.toMatchObject({code:'42501'});
  });

  it('retains the privileged-session MFA restriction on catalog reads', async () => {
    await asUser(async () => {
      expect((await db.query('select id from public.scorm_packages')).rows).toEqual([]);
    }, {user:admin,role:'admin',aal:'aal1'});
  });

  it('restricts an authenticated administrator with MFA to the current tenant progress', async () => {
    await asUser(async () => {
      expect((await db.query('select user_id from public.scorm_enrollments')).rows).toEqual([{user_id:owner}]);
    }, {user:admin,role:'admin',aal:'aal2'});
  });

  it('cascades only the removed QA profile progress and tracking', async () => {
    await db.exec('begin');
    try {
      await db.exec(`insert into public.scorm_tracking(scorm_enrollment_id,element,value)
        select id,'cmi.location','QA' from public.scorm_enrollments where user_id='${owner}';
        delete from public.profiles where id='${owner}';`);
      expect((await db.query('select user_id from public.scorm_enrollments')).rows).toEqual([{user_id:other}]);
      expect((await db.query('select id from public.scorm_tracking')).rows).toEqual([]);
    } finally { await db.exec('rollback'); }
  });

  it.each([
    ['delete from private.qa_environment_identity', 'UNAUTHORIZED_QA_PROJECT_IDENTITY'],
    ["update private.qa_environment_identity set project_ref='cuxzzpsyufcewtmicszk'", 'UNAUTHORIZED_QA_PROJECT_IDENTITY'],
    ['drop table private.qa_environment_identity', 'INDEPENDENT_QA_PROJECT_IDENTITY_REQUIRED'],
    ['delete from public.tenants', 'ISOLATED_QA_TENANT_REQUIRED'],
  ])('rejects an unverified environment before any schema change: %s', async (change, message) => {
    // Reuse one Postgres instance: multiple WASM engines retain large heaps in
    // the shared unit worker. A rollback restores the original contract and
    // saved progress after testing each absent-schema/environment combination.
    await db.exec('begin; drop table public.scorm_tracking; drop table public.scorm_enrollments; drop table public.scorm_packages;');
    try {
      await db.exec(change);
      await expect(db.exec(sql)).rejects.toThrow(message);
    } finally { await db.exec('rollback'); }
    expect((await db.query('select id from public.scorm_enrollments')).rows).toHaveLength(2);
    expect((await db.query('select id from public.scorm_packages')).rows).toHaveLength(7);
  });

  it('refuses to overwrite an existing SCORM contract or its saved progress', async () => {
    await expect(db.exec(sql)).rejects.toThrow('SCORM_CONTRACT_ALREADY_EXISTS_REVIEW_BEFORE_APPLY');
    await db.exec('rollback');
    expect((await db.query('select id from public.scorm_enrollments')).rows).toHaveLength(2);
  });
});
