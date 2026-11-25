// @vitest-environment node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterEach, describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL(
    '../../supabase/migrations/20261125080000_instructor_curriculum_ip_license.sql',
    import.meta.url,
  ),
  'utf8',
);
const agreementText = readFileSync(
  new URL('../../docs/legal/instructor-curriculum-ip-agreement-v1.md', import.meta.url),
  'utf8',
);
const agreementHash = createHash('sha256').update(agreementText).digest('hex');
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const databases: PGlite[] = [];
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.close()));
});

async function fixture(seedVersion = false, seedHash = agreementHash) {
  const db = new PGlite();
  databases.push(db);
  await db.exec(`
    CREATE TYPE public.agreement_type AS ENUM ('enrollment', 'instructor_services');
    CREATE TABLE public.license_agreement_acceptances (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL, agreement_type public.agreement_type NOT NULL,
      document_version text NOT NULL, signature_typed text NOT NULL
    );
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA rpc_private;
    GRANT USAGE ON SCHEMA public,rpc_private TO authenticated;
    CREATE SCHEMA auth;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user_id',true),'')::uuid $$;
    CREATE TABLE public.profiles(id uuid PRIMARY KEY, role text, is_active boolean, suspended boolean);
    CREATE TABLE public.instructor_assignments(instructor_id uuid, course_id uuid, active boolean, cohort_id uuid);
    CREATE TABLE public.program_enrollments(user_id uuid,student_id uuid,cohort_id uuid,revoked_at timestamptz,status text);
    CREATE TABLE public.interaction_progress(learner_id uuid,course_id uuid,interaction_type text,interaction_id text);
    ALTER TABLE public.interaction_progress ENABLE ROW LEVEL SECURITY;
    GRANT SELECT ON public.interaction_progress TO authenticated;
    CREATE TABLE public.courses(id uuid, program_id uuid, is_active boolean, status text);
    CREATE TABLE public.course_lessons(id uuid, course_id uuid, is_published boolean, status text);
    CREATE TABLE public.agreement_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agreement_type TEXT NOT NULL,
      version TEXT NOT NULL DEFAULT '1.0',
      current_version TEXT NOT NULL DEFAULT '1.0',
      is_current BOOLEAN NOT NULL DEFAULT TRUE,
      document_url TEXT NOT NULL,
      document_hash TEXT,
      effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
      expiry_date DATE,
      summary_of_changes TEXT,
      requires_re_acceptance BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id),
      UNIQUE(agreement_type, version)
    );
    INSERT INTO auth.users VALUES('${userId}');
  `);
  if (seedVersion) {
    await db.query(
      "INSERT INTO agreement_versions (agreement_type, version, current_version, document_url, document_hash) VALUES('instructor_curriculum_ip','1.0','1.0','/legal/instructor-curriculum-ip-agreement',$1)",
      [seedHash],
    );
  }
  return db;
}

describe('instructor curriculum IP license migration', () => {
  it('records a signature against the production enum after the migration commits', async () => {
    const db = await fixture();
    await db.exec('BEGIN');
    await db.exec(migration);
    await db.exec('COMMIT');
    await db.query(
      `INSERT INTO license_agreement_acceptances
      (user_id,agreement_type,document_version,signature_typed)
      VALUES ($1,'instructor_curriculum_ip','1.0','QA Instructor')`,
      [userId],
    );
    expect(
      (await db.query('SELECT signature_typed FROM license_agreement_acceptances')).rows,
    ).toEqual([{ signature_typed: 'QA Instructor' }]);
  });
  it('seeds version 1.0 with the SHA-256 of the canonical agreement text', async () => {
    const db = await fixture();
    await db.exec(migration);
    const rows = (
      await db.query<{
        agreement_type: string;
        version: string;
        document_hash: string;
        requires_re_acceptance: boolean;
      }>(
        "SELECT agreement_type, version, document_hash, requires_re_acceptance FROM agreement_versions WHERE agreement_type='instructor_curriculum_ip'",
      )
    ).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      agreement_type: 'instructor_curriculum_ip',
      version: '1.0',
      document_hash: agreementHash,
      requires_re_acceptance: true,
    });
    expect(agreementHash).toBe('46afcab2d33b33cb81804815176d064c898c1c060012f8c016ec1fbbf5742889');
  });

  it('creates the licenses table with one-active-license enforcement and RLS', async () => {
    const db = await fixture();
    await db.exec(migration);
    const table = (
      await db.query<{ relrowsecurity: boolean }>(
        "SELECT relrowsecurity FROM pg_class WHERE relname='instructor_curriculum_licenses'",
      )
    ).rows;
    expect(table[0].relrowsecurity).toBe(true);
    await db.query(
      `INSERT INTO instructor_curriculum_licenses
        (user_id, agreement_version, agreement_hash, scope, license_reference, status, signature_receipt)
       VALUES($1,'1.0',$2,'{"course_ids":[]}'::jsonb,'ELV-INST-ABCDEF01','active',$3::jsonb)`,
      [
        userId,
        agreementHash,
        JSON.stringify({
          acceptanceId: 'receipt',
          signedAt: '2026-11-25T12:00:00Z',
          signerName: 'QA',
          signerEmail: 'qa@example.com',
          method: 'typed',
          signature: 'QA',
          ipAddress: '127.0.0.1',
          userAgent: 'test',
        }),
      ],
    );
    await expect(
      db.query(
        `INSERT INTO instructor_curriculum_licenses
          (user_id, agreement_version, agreement_hash, scope, license_reference, status, signature_receipt)
         VALUES($1,'1.0',$2,'{"course_ids":[]}'::jsonb,'ELV-INST-ABCDEF02','active',$3::jsonb)`,
        [
          userId,
          agreementHash,
          JSON.stringify({
            acceptanceId: 'receipt',
            signedAt: '2026-11-25T12:00:00Z',
            signerName: 'QA',
            signerEmail: 'qa@example.com',
            method: 'typed',
            signature: 'QA',
            ipAddress: '127.0.0.1',
            userAgent: 'test',
          }),
        ],
      ),
    ).rejects.toThrow(/duplicate key|unique/i);
    await db.query(
      "UPDATE instructor_curriculum_licenses SET status='revoked',revoked_at='2026-11-25T11:00:00Z' WHERE license_reference='ELV-INST-ABCDEF01'",
    );
    await db.query(
      `INSERT INTO instructor_curriculum_licenses
        (user_id, agreement_version, agreement_hash, scope, license_reference, status, signature_receipt)
       VALUES($1,'1.0',$2,'{"course_ids":[]}'::jsonb,'ELV-INST-ABCDEF02','active',$3::jsonb)`,
      [
        userId,
        agreementHash,
        JSON.stringify({
          acceptanceId: 'receipt',
          signedAt: '2026-11-25T12:00:00Z',
          signerName: 'QA',
          signerEmail: 'qa@example.com',
          method: 'typed',
          signature: 'QA',
          ipAddress: '127.0.0.1',
          userAgent: 'test',
        }),
      ],
    );
    const active = (
      await db.query<{ license_reference: string }>(
        "SELECT license_reference FROM instructor_curriculum_licenses WHERE status='active'",
      )
    ).rows;
    expect(active).toEqual([{ license_reference: 'ELV-INST-ABCDEF02' }]);
  });

  it('is idempotent: re-running does not duplicate the version row', async () => {
    const db = await fixture();
    await db.exec(migration);
    await db.exec(migration);
    const rows = (
      await db.query(
        "SELECT id FROM agreement_versions WHERE agreement_type='instructor_curriculum_ip'",
      )
    ).rows;
    expect(rows).toHaveLength(1);
  });

  it('enforces licensing for direct assigned educator reads and preserves immutable renewal receipts', async () => {
    const db = await fixture();
    await db.exec(migration);
    const courseId = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201';
    await db.exec(`INSERT INTO profiles VALUES ('${userId}','instructor',true,false);
      INSERT INTO instructor_assignments VALUES ('${userId}','${courseId}',true,NULL);
      SELECT set_config('test.user_id','${userId}',false);`);
    const allowed = async () =>
      (
        await db.query<{ allowed: boolean }>(
          `SELECT rpc_private.assigned_educator_course_read('${courseId}') AS allowed`,
        )
      ).rows[0].allowed;
    expect(await allowed()).toBe(false);
    await db.query(
      `INSERT INTO license_agreement_acceptances
      (user_id,agreement_type,document_version,signature_typed)
      VALUES ($1,'instructor_curriculum_ip','1.0','QA')`,
      [userId],
    );
    const receipt = JSON.stringify({
      acceptanceId: 'original',
      signedAt: '2026-11-25T10:00:00Z',
      signerName: 'QA',
      signerEmail: 'qa@example.com',
      method: 'typed',
      signature: 'QA',
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    });
    await db.query(
      `INSERT INTO instructor_curriculum_licenses
      (user_id,agreement_version,agreement_hash,license_reference,signature_receipt)
      VALUES ($1,'1.0',$2,'FIRST',$3::jsonb)`,
      [userId, agreementHash, receipt],
    );
    expect(await allowed()).toBe(true);
    const cohort = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const student = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    await db.exec(`UPDATE instructor_assignments SET cohort_id='${cohort}';
      INSERT INTO program_enrollments VALUES ('${student}',NULL,'${cohort}',NULL,'active');`);
    expect(
      (
        await db.query<{ allowed: boolean }>(
          `SELECT rpc_private.can_review_hvac_simulation('${student}','${courseId}') AS allowed`,
        )
      ).rows[0].allowed,
    ).toBe(true);
    expect(
      (
        await db.query<{ allowed: boolean }>(
          `SELECT rpc_private.can_review_hvac_simulation('${userId}','${courseId}') AS allowed`,
        )
      ).rows[0].allowed,
    ).toBe(false);
    await db.exec(`INSERT INTO interaction_progress VALUES
      ('${student}','${courseId}','simulation','hvac-sim:chapter-01:v1'),
      ('${userId}','${courseId}','simulation','hvac-sim:chapter-01:v1');
      SET ROLE authenticated;`);
    expect((await db.query('SELECT learner_id FROM interaction_progress')).rows)
      .toEqual([{ learner_id: student }]);
    await db.exec('RESET ROLE');
    await expect(
      db.exec(`UPDATE instructor_curriculum_licenses SET signature_receipt='{}'`),
    ).rejects.toThrow('immutable');
    await db.exec(
      `UPDATE instructor_curriculum_licenses SET status='revoked',revoked_at='2026-11-25T11:00:00Z'`,
    );
    expect(await allowed()).toBe(false);
    await expect(
      db.query(
        `INSERT INTO instructor_curriculum_licenses
      (user_id,agreement_version,agreement_hash,license_reference,signature_receipt)
      VALUES ($1,'1.0',$2,'RENEWAL',$3::jsonb)`,
        [userId, agreementHash, receipt],
      ),
    ).rejects.toThrow('postdate revocation');
    const fresh = JSON.stringify({
      ...JSON.parse(receipt),
      signedAt: '2026-11-25T12:00:00Z',
      signature: 'Fresh QA',
    });
    await db.query(
      `INSERT INTO instructor_curriculum_licenses
      (user_id,agreement_version,agreement_hash,license_reference,signature_receipt)
      VALUES ($1,'1.0',$2,'RENEWAL',$3::jsonb)`,
      [userId, agreementHash, fresh],
    );
    expect(await allowed()).toBe(true);
    expect((await db.query('SELECT id FROM license_agreement_acceptances')).rows).toHaveLength(1);
    expect(
      (await db.query('SELECT signature_receipt FROM instructor_curriculum_licenses')).rows,
    ).toHaveLength(2);
  });

  it('refuses to run when v1.0 already exists with a different hash', async () => {
    const db = await fixture(true, 'deadbeef'.repeat(8));
    await expect(db.exec(migration)).rejects.toThrow(
      'instructor_curriculum_ip v1.0 hash changed; publish a new agreement version instead',
    );
  });
});
