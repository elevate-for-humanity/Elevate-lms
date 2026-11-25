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
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
    CREATE TABLE public.profiles(id uuid PRIMARY KEY, role text);
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
  it('seeds version 1.0 with the SHA-256 of the canonical agreement text', async () => {
    const db = await fixture();
    await db.exec(migration);
    const rows = (
      await db.query<{ agreement_type: string; version: string; document_hash: string; requires_re_acceptance: boolean }>(
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
    expect(agreementHash).toBe(
      '46afcab2d33b33cb81804815176d064c898c1c060012f8c016ec1fbbf5742889',
    );
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
        (user_id, agreement_version, agreement_hash, scope, license_reference, status)
       VALUES($1,'1.0',$2,'{"course_ids":[]}'::jsonb,'ELV-INST-ABCDEF01','active')`,
      [userId, agreementHash],
    );
    await expect(
      db.query(
        `INSERT INTO instructor_curriculum_licenses
          (user_id, agreement_version, agreement_hash, scope, license_reference, status)
         VALUES($1,'1.0',$2,'{"course_ids":[]}'::jsonb,'ELV-INST-ABCDEF02','active')`,
        [userId, agreementHash],
      ),
    ).rejects.toThrow(/duplicate key|unique/i);
    await db.query(
      "UPDATE instructor_curriculum_licenses SET status='revoked' WHERE license_reference='ELV-INST-ABCDEF01'",
    );
    await db.query(
      `INSERT INTO instructor_curriculum_licenses
        (user_id, agreement_version, agreement_hash, scope, license_reference, status)
       VALUES($1,'1.0',$2,'{"course_ids":[]}'::jsonb,'ELV-INST-ABCDEF02','active')`,
      [userId, agreementHash],
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

  it('refuses to run when v1.0 already exists with a different hash', async () => {
    const db = await fixture(true, 'deadbeef'.repeat(8));
    await expect(db.exec(migration)).rejects.toThrow(
      'instructor_curriculum_ip v1.0 hash changed; publish a new agreement version instead',
    );
  });
});
