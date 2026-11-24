import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

const holderId = 'acc9f5ab-8804-432e-9b12-aac1a6c86426';
const actorId = '11111111-1111-4111-8111-111111111111';
const packet = (timing) => ({
  mou: 'Final MOU text',
  nda: 'Separate NDA text',
  program_scope: 'Certified Nursing Assistant program only',
  incorporated_terms: 'Approved incorporated program-host terms',
  approval_reference: `approval-${timing}`,
  schedule_a: {
    collecting_party: 'Elevate',
    disbursement_method: 'Invoice',
    invoice_evidence: 'Attendance record',
    invoice_due_dates: 'Monthly',
    payment_timing: timing,
    refund_allocation: 'Prorated',
  },
});

let db;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    create table public.profiles (
      id uuid primary key,
      role text not null,
      is_active boolean,
      suspended boolean
    );
    create table public.program_holders (
      id uuid primary key,
      status text,
      approved_at timestamptz,
      features jsonb not null default '{}'::jsonb,
      updated_at timestamptz
    );
    create table public.admin_audit_events (
      id uuid primary key default gen_random_uuid(),
      action text not null,
      actor_user_id uuid not null,
      target_type text not null,
      target_id uuid not null,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
  `);
  await db.query('insert into auth.users (id) values ($1)', [actorId]);
  await db.query(
    `insert into public.profiles (id, role, is_active, suspended)
     values ($1, 'admin', true, false)`,
    [actorId],
  );
  await db.query(
    `insert into public.program_holders (id, status, approved_at)
     values ($1, 'approved_pending_mou', now())`,
    [holderId],
  );
  await db.exec(await readFile(
    'supabase/migrations/20261124090714_publish_achieve_cna_packet.sql',
    'utf8',
  ));
});

afterAll(async () => db?.close());

test('keeps the original and replacement packet text linked as immutable revisions', async () => {
  const firstPacket = packet('30 days');
  const secondPacket = packet('45 days');
  const first = await db.query(
    'select public.publish_achieve_cna_packet_v1($1, null, $2::jsonb, $3) as id',
    [actorId, JSON.stringify(firstPacket), 'a'.repeat(64)],
  );
  const firstId = first.rows[0].id;
  const second = await db.query(
    'select public.publish_achieve_cna_packet_v1($1, $2::jsonb, $3::jsonb, $4) as id',
    [actorId, JSON.stringify(firstPacket), JSON.stringify(secondPacket), 'b'.repeat(64)],
  );
  const secondId = second.rows[0].id;

  const revisions = await db.query(`
    select id, packet, supersedes_revision_id
    from public.achieve_cna_packet_revisions
    order by published_at, id
  `);
  expect(revisions.rows).toHaveLength(2);
  expect(revisions.rows.find((row) => row.id === firstId)?.packet).toEqual(firstPacket);
  expect(revisions.rows.find((row) => row.id === secondId)?.packet).toEqual(secondPacket);
  expect(revisions.rows.find((row) => row.id === secondId)?.supersedes_revision_id).toBe(firstId);

  const holder = await db.query(
    `select features->>'achieve_cna_current_revision_id' as revision_id,
            features->'achieve_cna_agreements' as packet
     from public.program_holders where id = $1`,
    [holderId],
  );
  expect(holder.rows[0]).toEqual({ revision_id: secondId, packet: secondPacket });

  await expect(db.query(
    'update public.achieve_cna_packet_revisions set approval_reference = $1 where id = $2',
    ['changed', firstId],
  )).rejects.toThrow('immutable');
  await expect(db.query(
    'delete from public.achieve_cna_packet_revisions where id = $1',
    [firstId],
  )).rejects.toThrow('immutable');
});

test('rejects a packet that omits the immutable MOU scope or incorporated terms', async () => {
  const incomplete = packet('60 days');
  Reflect.deleteProperty(incomplete, 'program_scope');
  Reflect.deleteProperty(incomplete, 'incorporated_terms');
  const current = await db.query(
    `select features->'achieve_cna_agreements' as packet
     from public.program_holders where id = $1`,
    [holderId],
  );
  await expect(db.query(
    'select public.publish_achieve_cna_packet_v1($1, $2::jsonb, $3::jsonb, $4)',
    [actorId, JSON.stringify(current.rows[0].packet), JSON.stringify(incomplete), 'c'.repeat(64)],
  )).rejects.toThrow('incomplete');
});
