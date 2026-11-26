import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const { PGlite } = await import(process.env.ELEVATE_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const owner = '11111111-1111-4111-8111-111111111111';
const tenant = '22222222-2222-4222-8222-222222222222';
const migration = await readFile(
  new URL(
    '../../supabase/migrations/20261124153906_restore_trusted_auth_profile_authority.sql',
    import.meta.url,
  ),
  'utf8',
);
let checks = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  checks++;
};
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table public.tenants(id uuid primary key, status text, is_platform_owner boolean default false, created_at timestamptz default now());
    create table public.profiles(id uuid primary key, email text, role text, tenant_id uuid not null references tenants(id), full_name text, last_sign_in_at timestamptz, updated_at timestamptz);
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{}', last_sign_in_at timestamptz);
    insert into tenants(id,status,is_platform_owner) values ('${owner}','active',true), ('${tenant}','active',false);
  `);
  await db.exec(
    await readFile(
      new URL(
        '../../supabase/migrations/20260812144247_fix_auth_profile_tenant_resolution.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  await db.exec(
    'create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user()',
  );
  async function create(publicMetadata = {}, trustedMetadata = {}, existing) {
    const id = existing || randomUUID();
    await db.query(
      'insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values ($1,$2,$3,$4)',
      [id, 'test@example.invalid', publicMetadata, trustedMetadata],
    );
    return (await db.query('select role,tenant_id,full_name from profiles where id=$1', [id]))
      .rows[0];
  }
  const profileSnapshot = async () => (await db.query('select * from profiles order by id')).rows;
  const functionDefinition = async () =>
    (
      await db.query(
        "select pg_get_functiondef('public.handle_new_user()'::regprocedure) as definition",
      )
    ).rows[0].definition;
  const accountCounts = async () =>
    (
      await db.query(
        'select (select count(*) from auth.users) as users, count(*) as profiles from profiles',
      )
    ).rows[0];
  async function rejectsAccount(trustedMetadata, message) {
    const before = await accountCounts();
    await assert.rejects(create({}, trustedMetadata), message);
    checks++;
    equal(await accountCounts(), before);
  }

  // Reproduce the observed production defect in this disposable PostgreSQL
  // database, then exercise the actual versioned repair rather than a SQL copy.
  equal(await create({ role: 'admin', tenant_id: tenant }), {
    role: 'admin',
    tenant_id: tenant,
    full_name: null,
  });
  const beforeMigration = await profileSnapshot();
  await db.exec(migration);
  equal(await profileSnapshot(), beforeMigration);
  const repairedDefinition = await functionDefinition();
  equal(
    (
      await db.query(
        "select md5(pg_get_functiondef('public.handle_new_user()'::regprocedure)) as hash",
      )
    ).rows[0].hash,
    '40bcbfb2756d833e358f1d59cd03234f',
  );
  equal(await create(), { role: 'student', tenant_id: owner, full_name: null });
  equal(await create(null, null), { role: 'student', tenant_id: owner, full_name: null });
  equal(await create({ requested_role: 'employer' }), {
    role: 'student',
    tenant_id: owner,
    full_name: null,
  });
  for (const role of [
    'admin',
    'super_admin',
    'instructor',
    'program_holder',
    'site_coordinator',
    'provider_admin',
    'employer',
  ]) {
    const profile = await create({ role, tenant_id: tenant, full_name: 'Display Name' });
    equal(profile, { role: 'student', tenant_id: owner, full_name: 'Display Name' });
  }
  equal(await create({ role: 'student', tenant_id: owner }, { role: 'admin', tenant_id: tenant }), {
    role: 'admin',
    tenant_id: tenant,
    full_name: null,
  });
  equal((await create({}, { role: 'site_coordinator' })).role, 'site_coordinator');
  equal((await create({}, { role: 'org_admin', tenant_id: tenant })).role, 'org_admin');
  equal((await create({}, { role: 'ADMIN', tenant_id: tenant })).role, 'admin');
  equal(await create({ tenant_id: 'invalid', first_name: 'First', last_name: 'Last' }), {
    role: 'student',
    tenant_id: owner,
    full_name: 'First Last',
  });
  equal(
    (await create({ full_name: 'Preferred Name', first_name: 'First', last_name: 'Last' }))
      .full_name,
    'Preferred Name',
  );
  for (const role of [
    'workforce_board',
    'host_shop_admin',
    'provider_admin',
    'barber_apprentice',
  ]) {
    equal((await create({}, { role })).role, role);
  }
  equal(
    (await create({ first_name: 'First', last_name: 'Last' }, { role: 'not_a_role' })).full_name,
    'First Last',
  );
  equal((await create({}, { role: 'not_a_role' })).role, 'student');
  const existing = randomUUID();
  await db.query('insert into profiles(id,role,tenant_id,full_name) values ($1,$2,$3,$4)', [
    existing,
    'instructor',
    tenant,
    'Preserved',
  ]);
  equal(await create({ role: 'super_admin', tenant_id: owner }, {}, existing), {
    role: 'instructor',
    tenant_id: tenant,
    full_name: 'Preserved',
  });
  const existingStudent = randomUUID();
  await db.query('insert into profiles(id,role,tenant_id,full_name) values ($1,$2,$3,$4)', [
    existingStudent,
    'student',
    tenant,
    'Preserved Student',
  ]);
  equal(await create({ role: 'super_admin' }, { role: 'program_holder' }, existingStudent), {
    role: 'program_holder',
    tenant_id: tenant,
    full_name: 'Preserved Student',
  });
  for (const tenant_id of ['invalid', randomUUID()]) {
    await rejectsAccount(
      { role: 'admin', tenant_id },
      /Trusted profile tenant is not an active configured tenant/,
    );
  }
  await db.query('update tenants set status=$1 where id=$2', ['inactive', tenant]);
  await rejectsAccount({ role: 'admin', tenant_id: tenant }, /Trusted profile tenant/);
  await db.exec('update tenants set is_platform_owner=false');
  await rejectsAccount({}, /No active platform-owner tenant/);
  equal(
    (
      await db.query(
        "select has_function_privilege('anon','public.handle_new_user()','EXECUTE') as allowed",
      )
    ).rows[0].allowed,
    false,
  );
  equal(
    (
      await db.query(
        "select has_function_privilege('authenticated','public.handle_new_user()','EXECUTE') as allowed",
      )
    ).rows[0].allowed,
    false,
  );
  equal(
    (
      await db.query(
        "select has_function_privilege('service_role','public.handle_new_user()','EXECUTE') as allowed",
      )
    ).rows[0].allowed,
    true,
  );
  // A re-run is safe, including environments where the earlier hardened block
  // was already applied. An unrelated function change must never be overwritten.
  const beforeRepeat = await profileSnapshot();
  await db.exec(migration);
  equal(await profileSnapshot(), beforeRepeat);
  equal(await functionDefinition(), repairedDefinition);
  await db.exec('alter function public.handle_new_user() set search_path to pg_catalog');
  const unreviewedDefinition = await functionDefinition();
  await assert.rejects(db.exec(migration), /handle_new_user definition changed since review/);
  checks++;
  equal(await functionDefinition(), unreviewedDefinition);
  equal(await profileSnapshot(), beforeRepeat);
  console.log(
    `Auth provisioning PostgreSQL: ${checks} checks passed; no production records created.`,
  );
} finally {
  await db.close();
}
