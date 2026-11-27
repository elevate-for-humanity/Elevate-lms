// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20261124193007_bind_cleaning_provider_email_proof.sql',
  'utf8',
);
const user = '11111111-1111-4111-8111-111111111111';
const otherUser = '22222222-2222-4222-8222-222222222222';
const website = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const otherWebsite = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const originalSession = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const newSession = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const otherSession = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const missingId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const email = 'provider@example.invalid';
const state = 'a'.repeat(64);
const browser = 'b'.repeat(64);
const claimHash = 'c'.repeat(64);
const verifier = 'v'.repeat(64);
const tables = ['cleaning_provider_email_challenges', 'cleaning_provider_email_proofs'];
const beginSql = 'select public.cleaning_provider_proof_begin($1,$2,$3,$4,$5,$6,$7) as result';
const claimSql = 'select public.cleaning_provider_proof_claim($1,$2,$3,$4,$5,$6,$7) as result';
const completeSql = 'select public.cleaning_provider_proof_complete($1,$2,$3,$4,$5) as result';
const validSql = 'select public.cleaning_provider_proof_valid($1,$2,$3,$4) as result';

type Challenge = { challenge_id: string; expires_at: string };
type Claimed = Challenge & { user_id: string; email: string; session_id: string; verifier: string };
type Role = 'anon' | 'authenticated' | 'service_role';
let db: PGlite;

// Existing Auth identities are modeled locally; the migration, FK constraints,
// RLS, grants, locking statements and mutations execute in real PostgreSQL.
const bootstrap = `
  create role anon;
  create role authenticated;
  create role service_role bypassrls;
  create schema auth;
  create table auth.users(
    id uuid primary key, email text, email_confirmed_at timestamptz,
    is_anonymous boolean not null default false, deleted_at timestamptz,
    banned_until timestamptz, updated_at timestamptz default now()
  );
  create table auth.sessions(
    id uuid primary key, user_id uuid references auth.users(id) on delete cascade,
    not_after timestamptz, updated_at timestamptz default now()
  );
  create table auth.mfa_amr_claims(
    session_id uuid references auth.sessions(id) on delete cascade,
    authentication_method text, created_at timestamptz default now(),
    unique(session_id,authentication_method)
  );
  alter table auth.users enable row level security;
  alter table auth.sessions enable row level security;
  alter table auth.mfa_amr_claims enable row level security;
  create table public.user_websites(id uuid primary key);
  -- Supabase projects may grant newly created public tables/functions by
  -- default. The migration must explicitly remove those inherited grants.
  alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
  alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
`;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(bootstrap);
  await db.exec(migration);
}, 20000);
afterAll(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.exec(`begin;
    insert into auth.users(id,email,email_confirmed_at) values
      ('${user}','${email}',now()), ('${otherUser}','other@example.invalid',now());
    insert into auth.sessions(id,user_id) values
      ('${originalSession}','${user}'),('${newSession}','${user}'),('${otherSession}','${otherUser}');
    insert into auth.mfa_amr_claims(session_id,authentication_method)
      values ('${newSession}','magiclink');
    insert into public.user_websites values ('${website}'),('${otherWebsite}');
  `);
});
afterEach(async () => {
  await db.exec('rollback');
});

async function asRole<T>(work: () => Promise<T>, role: Role = 'service_role') {
  await db.exec(`savepoint role_check; set local role ${role}`);
  try {
    const result = await work();
    await db.exec('reset role; release savepoint role_check');
    return result;
  } catch (error) {
    await db.exec('rollback to savepoint role_check; reset role; release savepoint role_check');
    throw error;
  }
}

async function result<T>(sql: string, args: unknown[]) {
  return (await db.query<{ result: T }>(sql, args)).rows[0].result;
}
const beginArgs = () => [website, user, originalSession, email, state, browser, verifier];
const claimArgs = () => [website, user, originalSession, email, state, browser, claimHash];
const begin = (args = beginArgs()) => asRole(() => result<Challenge>(beginSql, args));
const claim = (args = claimArgs()) => asRole(() => result<Claimed | null>(claimSql, args));
const complete = (id: string, args = [id, claimHash, user, newSession, email]) =>
  asRole(() => result<boolean>(completeSql, args));
const valid = (args = [website, user, newSession, email]) =>
  asRole(() => result<boolean>(validSql, args));
const cancel = (args = [website, user, state]) =>
  asRole(() =>
    result<boolean>('select public.cleaning_provider_proof_cancel($1,$2,$3) as result', args),
  );
async function claimedChallenge() {
  const challenge = await begin();
  expect(await claim()).not.toBeNull();
  return challenge;
}
async function completedChallenge() {
  const challenge = await claimedChallenge();
  expect(await complete(challenge.challenge_id)).toBe(true);
  return challenge;
}

describe('server-owned cleaning provider mailbox proof database contract', () => {
  it('installs restricted owners, RLS and only the five service-only functions', async () => {
    const relations = await db.query<{ relname: string; relrowsecurity: boolean; owner: string }>(
      `
      select c.relname,c.relrowsecurity,pg_get_userbyid(c.relowner) as owner
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=any($1::text[]) order by c.relname`,
      [tables],
    );
    expect(relations.rows).toEqual(
      tables.map((relname) => ({ relname, relrowsecurity: true, owner: 'postgres' })),
    );
    const functions = await db.query<{
      proname: string;
      prosecdef: boolean;
      proconfig: string[];
      owner: string;
      service: boolean;
      client: boolean;
      anonymous: boolean;
    }>(`
      select p.proname,p.prosecdef,p.proconfig,pg_get_userbyid(p.proowner) as owner,
        has_function_privilege('service_role',p.oid,'execute') as service,
        has_function_privilege('authenticated',p.oid,'execute') as client,
        has_function_privilege('anon',p.oid,'execute') as anonymous
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname like 'cleaning_provider_proof_%'`);
    expect(functions.rows).toHaveLength(5);
    for (const entry of functions.rows)
      expect(entry).toMatchObject({
        prosecdef: true,
        proconfig: ['search_path=pg_catalog'],
        owner: 'postgres',
        service: true,
        client: false,
        anonymous: false,
      });
    expect(
      (
        await db.query(
          `select * from pg_policies where schemaname='public'
      and tablename=any($1::text[])`,
          [tables],
        )
      ).rows,
    ).toEqual([]);
  });

  it.each(['anon', 'authenticated', 'service_role'] as const)(
    'denies direct challenge/proof reads and writes to %s',
    async (role) => {
      for (const table of tables)
        for (const operation of [
          `select * from public.${table}`,
          `delete from public.${table}`,
          `update public.${table} set email='changed@example.invalid'`,
          `insert into public.${table}(email) values ('changed@example.invalid')`,
        ])
          await expect(asRole(() => db.exec(operation), role)).rejects.toMatchObject({
            code: '42501',
          });
    },
  );

  it.each(['anon', 'authenticated'] as const)(
    'denies every RPC to %s despite forged JWT settings',
    async (role) => {
      const calls: [string, unknown[]][] = [
        [beginSql, beginArgs()],
        [claimSql, claimArgs()],
        [completeSql, [missingId, claimHash, user, newSession, email]],
        [validSql, [website, user, newSession, email]],
        [
          'select public.cleaning_provider_proof_cancel($1,$2,$3) as result',
          [website, user, state],
        ],
      ];
      for (const [sql, args] of calls)
        await expect(
          asRole(async () => {
            await db.query("select set_config('request.jwt.claims',$1,true)", [
              JSON.stringify({ role: 'service_role', sub: user }),
            ]);
            return result(sql, args);
          }, role),
        ).rejects.toMatchObject({ code: '42501' });
    },
  );

  it('creates only bounded protected state and returns no verifier to the start caller', async () => {
    const challenge = await begin();
    expect(Object.keys(challenge).sort()).toEqual(['challenge_id', 'expires_at']);
    const row = (
      await db.query<{ email: string; code_verifier: string; seconds: number }>(
        `
      select email,code_verifier,extract(epoch from expires_at-created_at)::float8 as seconds
      from public.cleaning_provider_email_challenges where id=$1`,
        [challenge.challenge_id],
      )
    ).rows[0];
    expect(row).toEqual({ email, code_verifier: verifier, seconds: 600 });
    expect(await valid()).toBe(false);
  });

  it.each([
    ['uppercase email', 3, 'Provider@example.invalid'],
    ['whitespace email', 3, ` ${email}`],
    ['short email', 3, 'a'],
    ['raw state', 4, 'opaque-but-unhashed'],
    ['bad browser hash', 5, 'x'.repeat(64)],
    ['short verifier', 6, 'v'.repeat(42)],
    ['long verifier', 6, 'v'.repeat(129)],
    ['verifier suffix', 6, `${verifier}/PASSWORD_RECOVERY`],
  ])('rejects invalid state inputs: %s', async (_name, index, value) => {
    const args = beginArgs();
    args[Number(index)] = String(value);
    await expect(begin(args)).rejects.toMatchObject({ code: '22023' });
    expect(
      (await db.query('select id from public.cleaning_provider_email_challenges')).rows,
    ).toEqual([]);
  });

  it.each([
    ['another user', 1, otherUser],
    ['another session owner', 2, otherSession],
    ['missing session', 2, missingId],
    ['another email', 3, 'other@example.invalid'],
  ])('requires the current Auth identity at start: %s', async (_name, index, value) => {
    const args = beginArgs();
    args[Number(index)] = String(value);
    await expect(begin(args)).rejects.toMatchObject({ code: '42501' });
  });

  it.each([
    ['anonymous', 'is_anonymous=true'],
    ['soft-deleted', 'deleted_at=now()'],
    ['unconfirmed', 'email_confirmed_at=null'],
    ['banned', "banned_until=now()+interval '1 day'"],
  ])('rejects a %s Auth user at start', async (_name, change) => {
    await db.exec(`update auth.users set ${change} where id='${user}'`);
    await expect(begin()).rejects.toMatchObject({ code: '42501' });
  });

  it('rejects expired original sessions and nonexistent websites', async () => {
    await db.query("update auth.sessions set not_after=now()-interval '1 second' where id=$1", [
      originalSession,
    ]);
    await expect(begin()).rejects.toMatchObject({ code: '42501' });
    await db.query('update auth.sessions set not_after=null where id=$1', [originalSession]);
    const args = beginArgs();
    args[0] = missingId;
    await expect(begin(args)).rejects.toMatchObject({ code: '23503' });
  });

  it.each([
    ['website', 0, otherWebsite],
    ['user', 1, otherUser],
    ['original session', 2, newSession],
    ['email', 3, 'other@example.invalid'],
    ['state', 4, 'd'.repeat(64)],
    ['browser nonce', 5, 'd'.repeat(64)],
    ['claim hash', 6, 'not-a-hash'],
  ])('does not reveal or consume state with the wrong %s', async (_name, index, value) => {
    await begin();
    const args = claimArgs();
    args[Number(index)] = String(value);
    expect(await claim(args)).toBeNull();
    expect(await claim()).toMatchObject({
      user_id: user,
      email,
      session_id: originalSession,
      verifier,
    });
  });

  it('claims once, erases the verifier and never allows reclaim or cancellation after claim', async () => {
    const challenge = await begin();
    expect(await claim()).toMatchObject({ challenge_id: challenge.challenge_id, verifier });
    expect(await claim()).toBeNull();
    expect(await cancel()).toBe(false);
    const row = (
      await db.query<{
        code_verifier: string | null;
        claimed_at: string | null;
        claim_hash: string | null;
      }>(
        'select code_verifier,claimed_at,claim_hash from public.cleaning_provider_email_challenges',
      )
    ).rows[0];
    expect(row.code_verifier).toBeNull();
    expect(row.claimed_at).not.toBeNull();
    expect(row.claim_hash).toBe(claimHash);
  });

  it('gives exactly one result to competing claims against the real atomic RPC', async () => {
    await begin();
    const second = claimArgs();
    second[6] = 'd'.repeat(64);
    // PGlite queues queries on one connection. Both competing requests run
    // the actual row-locking function; only one committed state can win.
    const claims = await asRole(() =>
      Promise.all([
        result<Claimed | null>(claimSql, claimArgs()),
        result<Claimed | null>(claimSql, second),
      ]),
    );
    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(claims.find(Boolean)?.verifier).toBe(verifier);
    expect(
      (
        await db.query<{ code_verifier: string | null }>(
          'select code_verifier from public.cleaning_provider_email_challenges',
        )
      ).rows[0].code_verifier,
    ).toBeNull();
  });

  it('rejects expired challenges and an original email/session that changed before claim', async () => {
    await begin();
    await db.query(
      "update public.cleaning_provider_email_challenges set created_at=now()-interval '11 minutes',expires_at=now()-interval '1 minute' where state_hash=$1",
      [state],
    );
    expect(await claim()).toBeNull();
    await db.query(
      "update public.cleaning_provider_email_challenges set created_at=now(),expires_at=now()+interval '10 minutes' where state_hash=$1",
      [state],
    );
    await db.query('update auth.users set email=$1 where id=$2', ['new@example.invalid', user]);
    expect(await claim()).toBeNull();
    await db.query('update auth.users set email=$1 where id=$2', [email, user]);
    await db.query('delete from auth.sessions where id=$1', [originalSession]);
    expect(await claim()).toBeNull();
  });

  it('cancels only the matching unclaimed request and erases its verifier', async () => {
    await begin();
    expect(await cancel([otherWebsite, user, state])).toBe(false);
    expect(await cancel([website, otherUser, state])).toBe(false);
    expect(await cancel()).toBe(true);
    expect(await cancel()).toBe(false);
    expect(await claim()).toBeNull();
    expect(
      (
        await db.query<{ code_verifier: string | null }>(
          'select code_verifier from public.cleaning_provider_email_challenges',
        )
      ).rows[0].code_verifier,
    ).toBeNull();
  });

  it.each([true, false])(
    'has one safe outcome when cancellation and claim compete (cancel first=%s)',
    async (cancelFirst) => {
      await begin();
      const actions = [
        () =>
          result<boolean>('select public.cleaning_provider_proof_cancel($1,$2,$3) as result', [
            website,
            user,
            state,
          ]),
        () => result<Claimed | null>(claimSql, claimArgs()),
      ];
      if (!cancelFirst) actions.reverse();
      const outcomes = await asRole(() => Promise.all(actions.map((action) => action())));
      expect(outcomes.filter(Boolean)).toHaveLength(1);
      expect(
        (
          await db.query<{ code_verifier: string | null }>(
            'select code_verifier from public.cleaning_provider_email_challenges',
          )
        ).rows[0].code_verifier,
      ).toBeNull();
    },
  );

  it('cannot complete unclaimed state or authorize a password/OTP session', async () => {
    const challenge = await begin();
    expect(await complete(challenge.challenge_id)).toBe(false);
    await claim();
    await db.exec("update auth.mfa_amr_claims set authentication_method='otp'");
    expect(await complete(challenge.challenge_id)).toBe(false);
    expect(await valid()).toBe(false);
  });

  it.each([
    ['claim', 1, 'd'.repeat(64)],
    ['user', 2, otherUser],
    ['session owner', 3, otherSession],
    ['original session', 3, originalSession],
    ['missing session', 3, missingId],
    ['email', 4, 'other@example.invalid'],
  ])('rejects completion with the wrong %s', async (_name, index, value) => {
    const challenge = await claimedChallenge();
    const args = [challenge.challenge_id, claimHash, user, newSession, email];
    args[Number(index)] = String(value);
    expect(await complete(challenge.challenge_id, args)).toBe(false);
    expect(await valid()).toBe(false);
  });

  it('enforces both the short claim deadline and the original challenge deadline', async () => {
    const challenge = await claimedChallenge();
    await db.exec(`update public.cleaning_provider_email_challenges set
      created_at=now()-interval '4 minutes',claimed_at=now()-interval '3 minutes',
      expires_at=now()+interval '6 minutes'`);
    expect(await complete(challenge.challenge_id)).toBe(false);
    await db.exec(`update public.cleaning_provider_email_challenges set
      created_at=now()-interval '11 minutes',claimed_at=now()-interval '1 minute',
      expires_at=now()-interval '1 minute'`);
    expect(await complete(challenge.challenge_id)).toBe(false);
  });

  it('atomically records one 30-day exact session/email proof and refuses completion replay', async () => {
    const challenge = await completedChallenge();
    expect(await valid()).toBe(true);
    const proof = (
      await db.query<
        Record<string, unknown>
      >(`select *,extract(epoch from expires_at-verified_at)::float8 as seconds
      from public.cleaning_provider_email_proofs`)
    ).rows[0];
    expect(proof).toMatchObject({
      website_id: website,
      user_id: user,
      session_id: newSession,
      email,
      seconds: 30 * 86400,
    });
    expect(await complete(challenge.challenge_id)).toBe(false);
    expect((await db.query('select * from public.cleaning_provider_email_proofs')).rows[0]).toEqual(
      Object.fromEntries(Object.entries(proof).filter(([key]) => key !== 'seconds')),
    );
    const row = (
      await db.query<{ code_verifier: string | null; completed_at: string | null }>(
        'select code_verifier,completed_at from public.cleaning_provider_email_challenges',
      )
    ).rows[0];
    expect(row.code_verifier).toBeNull();
    expect(row.completed_at).not.toBeNull();
  });

  it('completes after the exchange revokes the original login while preserving the new session', async () => {
    const challenge = await claimedChallenge();
    await db.query('delete from auth.sessions where id=$1', [originalSession]);
    expect(await complete(challenge.challenge_id)).toBe(true);
    expect(await valid()).toBe(true);
    await db.query('delete from auth.sessions where id=$1', [newSession]);
    expect(await valid()).toBe(false);
  });

  it('allows only one concurrent completion and never extends a replayed proof', async () => {
    const challenge = await claimedChallenge();
    const args = [challenge.challenge_id, claimHash, user, newSession, email];
    expect(
      (
        await asRole(() =>
          Promise.all([result<boolean>(completeSql, args), result<boolean>(completeSql, args)]),
        )
      ).sort(),
    ).toEqual([false, true]);
    expect(
      (await db.query('select * from public.cleaning_provider_email_proofs')).rows,
    ).toHaveLength(1);
  });

  it('rolls back proof creation if challenge consumption fails in the same transaction', async () => {
    const challenge = await claimedChallenge();
    await db.exec(`create function pg_temp.reject_completion() returns trigger language plpgsql as
      $$ begin if new.completed_at is not null then raise exception 'forced consume failure'; end if; return new; end $$;
      create trigger reject_completion before update on public.cleaning_provider_email_challenges
      for each row execute function pg_temp.reject_completion();`);
    await expect(complete(challenge.challenge_id)).rejects.toThrow('forced consume failure');
    expect((await db.query('select * from public.cleaning_provider_email_proofs')).rows).toEqual(
      [],
    );
    expect(
      (
        await db.query<{ completed_at: string | null }>(
          'select completed_at from public.cleaning_provider_email_challenges',
        )
      ).rows[0].completed_at,
    ).toBeNull();
    await db.exec('drop trigger reject_completion on public.cleaning_provider_email_challenges');
    expect(await complete(challenge.challenge_id)).toBe(true);
  });

  it('rejects delayed old-mailbox code exchange even when the new session has a fresh magiclink AMR', async () => {
    const challenge = await claimedChallenge();
    await db.query('update auth.users set email=$1 where id=$2', ['new@example.invalid', user]);
    await db.exec('update auth.mfa_amr_claims set created_at=clock_timestamp()');
    expect(await complete(challenge.challenge_id)).toBe(false);
    expect(
      await complete(challenge.challenge_id, [
        challenge.challenge_id,
        claimHash,
        user,
        newSession,
        'new@example.invalid',
      ]),
    ).toBe(false);
    expect(await valid()).toBe(false);
    expect(await valid([website, user, newSession, 'new@example.invalid'])).toBe(false);
  });

  it.each([
    ['website', 0, otherWebsite],
    ['user', 1, otherUser],
    ['session', 2, originalSession],
    ['email', 3, 'other@example.invalid'],
  ])('does not reuse a completed proof for another %s', async (_name, index, value) => {
    await completedChallenge();
    const args = [website, user, newSession, email];
    args[Number(index)] = String(value);
    expect(await valid(args)).toBe(false);
  });

  it.each([
    ['email change', "update auth.users set email='new@example.invalid'"],
    ['anonymous account', 'update auth.users set is_anonymous=true'],
    ['soft-deleted account', 'update auth.users set deleted_at=now()'],
    ['unconfirmed account', 'update auth.users set email_confirmed_at=null'],
    ['banned account', "update auth.users set banned_until=now()+interval '1 day'"],
    ['session expiry', "update auth.sessions set not_after=now()-interval '1 second'"],
    ['deleted session', `delete from auth.sessions where id='${newSession}'`],
    [
      'proof expiry',
      `update public.cleaning_provider_email_proofs set
      verified_at=now()-interval '31 days',expires_at=now()-interval '1 day'`,
    ],
  ])('invalidates completed proof after %s', async (_name, change) => {
    await completedChallenge();
    await db.exec(change);
    expect(await valid()).toBe(false);
  });

  it('keeps valid proof across ordinary session refresh without depending on mutable user timestamps', async () => {
    await completedChallenge();
    await db.exec(
      'update auth.users set updated_at=clock_timestamp(); update auth.sessions set updated_at=clock_timestamp()',
    );
    expect(await valid()).toBe(true);
  });

  it('does not overwrite an existing proof when a second challenge names the same session', async () => {
    await completedChallenge();
    const original = (await db.query('select * from public.cleaning_provider_email_proofs')).rows;
    const args = beginArgs();
    args[4] = 'd'.repeat(64);
    const second = await begin(args);
    const claimInput = claimArgs();
    claimInput[4] = args[4];
    await claim(claimInput);
    expect(await complete(second.challenge_id)).toBe(false);
    expect((await db.query('select * from public.cleaning_provider_email_proofs')).rows).toEqual(
      original,
    );
  });

  it('cleans only same-user/site expired state and retains already verified proof', async () => {
    const challenge = await completedChallenge();
    const otherArgs = beginArgs();
    otherArgs[0] = otherWebsite;
    otherArgs[4] = 'd'.repeat(64);
    const other = await begin(otherArgs);
    await db.query(
      `update public.cleaning_provider_email_challenges set
      created_at=now()-interval '12 minutes',claimed_at=now()-interval '11 minutes',
      completed_at=now()-interval '11 minutes',expires_at=now()-interval '2 minutes'
      where id=$1`,
      [challenge.challenge_id],
    );
    const fresh = beginArgs();
    fresh[4] = 'e'.repeat(64);
    await begin(fresh);
    expect(
      (
        await db.query('select id from public.cleaning_provider_email_challenges where id=$1', [
          challenge.challenge_id,
        ])
      ).rows,
    ).toEqual([]);
    expect(
      (
        await db.query('select id from public.cleaning_provider_email_challenges where id=$1', [
          other.challenge_id,
        ])
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query<{ challenge_id: string | null }>(
          'select challenge_id from public.cleaning_provider_email_proofs',
        )
      ).rows[0].challenge_id,
    ).toBeNull();
    expect(await valid()).toBe(true);
  });

  it('cascades deleted users and websites only through their owned state/proof records', async () => {
    await completedChallenge();
    const args = beginArgs();
    args[0] = otherWebsite;
    args[1] = otherUser;
    args[2] = otherSession;
    args[3] = 'other@example.invalid';
    args[4] = 'd'.repeat(64);
    const other = await begin(args);
    await db.query('delete from auth.users where id=$1', [user]);
    expect(
      (await db.query('select id from public.cleaning_provider_email_challenges')).rows,
    ).toEqual([{ id: other.challenge_id }]);
    expect((await db.query('select * from public.cleaning_provider_email_proofs')).rows).toEqual(
      [],
    );
    await db.query('delete from public.user_websites where id=$1', [otherWebsite]);
    expect(
      (await db.query('select * from public.cleaning_provider_email_challenges')).rows,
    ).toEqual([]);
  });
});
