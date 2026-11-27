// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

type Row = Record<string, unknown>;
const m = vi.hoisted(() => ({
  auth: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', user: { email: 'david@example.com' }, error: null as NextResponse | null },
  tables: {} as Record<string, Row[]>,
  assigned: new Set<string>(),
  recordCalls: [] as Row[],
  recordSuccess: true,
  upserts: [] as Row[],
  rate: null as NextResponse | null,
}));

vi.mock('@/lib/admin/guards', () => ({
  apiAuthGuard: async () => (m.auth.error ? { error: m.auth.error } : { id: m.auth.id, user: m.auth.user }),
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => m.rate }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => database() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/lms/instructor-course-access', () => ({
  isAssignedCourseInstructor: async (_db: unknown, userId: string, courseId: string) =>
    m.assigned.has(`${userId}:${courseId}`),
}));
vi.mock('@/lib/legal/recordAgreementAcceptance', () => ({
  extractRequestMetadata: () => ({ ipAddress: '127.0.0.1', userAgent: 'test-agent' }),
  recordAgreementAcceptance: async (input: Row) => {
    // The db client holds functions and cannot be structuredClone'd; record
    // the serializable call fields only.
    const { supabase: _supabase, ...rest } = input;
    m.recordCalls.push(structuredClone(rest));
    if (!m.recordSuccess) return { success: false, error: 'Recording failed' };
    // Mirror the real recorder: a successful recording leaves the acceptance
    // row the gate reads.
    (m.tables.license_agreement_acceptances ??= []).push({
      id: 'acc-1',
      user_id: input.userId,
      agreement_type: input.agreementType,
      document_version: input.documentVersion,
    });
    return { success: true, id: 'acc-1', alreadyExists: false };
  },
}));

import { getInstructorCurriculumLicenseStatus } from '@/lib/legal/instructorCurriculumLicense';
import { POST as signPost } from '@/apps/lms/app/api/onboarding/instructor/sign-agreement/route';
import {
  GET as licenseGet,
  POST as licensePost,
} from '@/apps/lms/app/api/onboarding/instructor/curriculum-license/route';

const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const adminId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const courseId = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201';
const hash = '46afcab2d33b33cb81804815176d064c898c1c060012f8c016ec1fbbf5742889';
const url = 'https://app.elevateforhumanity.org/api/onboarding/instructor';

function database() {
  return {
    from(table: string) {
      const filters: [string, unknown][] = [];
      let orderDesc = false;
      let insertValues: Row | null = null;
      let updateValues: Row | null = null;
      let upsertValues: Row | null = null;
      const query: any = {
        select: () => query,
        eq: (column: string, value: unknown) => {
          filters.push([column, value]);
          return query;
        },
        order: (_column: string, opts: { ascending: boolean }) => {
          orderDesc = !opts.ascending;
          return query;
        },
        limit: () => query,
        insert: (values: Row) => {
          insertValues = values;
          return query;
        },
        update: (values: Row) => {
          updateValues = values;
          return query;
        },
        upsert: (values: Row) => {
          upsertValues = values;
          return query;
        },
        async maybeSingle() {
          if (insertValues) {
            const row = { id: `row-${(m.tables[table] ?? []).length + 1}`, ...structuredClone(insertValues) };
            (m.tables[table] ??= []).push(row);
            return { data: structuredClone(row), error: null };
          }
          const rows = [...(m.tables[table] ?? [])];
          if (orderDesc) rows.reverse();
          const found = rows.find((row) =>
            filters.every(([column, value]) => row[column] === value),
          );
          return { data: found ? structuredClone(found) : null, error: null };
        },
        then(resolve: (value: unknown) => void) {
          let result: { data: unknown; error: null };
          if (upsertValues) {
            m.upserts.push(structuredClone(upsertValues));
            result = { data: null, error: null };
          } else if (updateValues) {
            const rows = m.tables[table] ?? [];
            const matched = rows.filter((row) =>
              filters.every(([column, value]) => row[column] === value),
            );
            for (const row of matched) Object.assign(row, structuredClone(updateValues));
            result = { data: structuredClone(matched), error: null };
          } else if (insertValues) {
            const row = { id: `row-${(m.tables[table] ?? []).length + 1}`, ...structuredClone(insertValues) };
            (m.tables[table] ??= []).push(row);
            result = { data: [structuredClone(row)], error: null };
          } else {
            const rows = [...(m.tables[table] ?? [])];
            if (orderDesc) rows.reverse();
            result = {
              data: rows.filter((row) =>
                filters.every(([column, value]) => row[column] === value),
              ),
              error: null,
            };
          }
          return Promise.resolve(result).then(resolve);
        },
      };
      return query;
    },
  };
}

function seed() {
  m.tables = {
    profiles: [
      { id: userId, role: 'instructor' },
      { id: adminId, role: 'admin' },
    ],
    agreement_versions: [
      {
        agreement_type: 'instructor_curriculum_ip',
        version: '1.0',
        current_version: '1.0',
        is_current: true,
        document_hash: hash,
        created_at: '2026-11-25T00:00:00Z',
      },
    ],
    license_agreement_acceptances: [],
    instructor_curriculum_licenses: [],
    instructor_assignments: [],
    license_audit_log: [],
  };
  m.assigned.add(`${userId}:${courseId}`);
}

function sign(body: Record<string, unknown>) {
  return signPost(
    new NextRequest(`${url}/sign-agreement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agreement_version: '1.0', ...body }),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  m.auth = { id: userId, user: { email: 'david@example.com' }, error: null };
  m.recordCalls = [];
  m.recordSuccess = true;
  m.upserts = [];
  m.rate = null;
  m.assigned = new Set();
  seed();
});

describe('instructor IP agreement signing route', () => {
  it('signs the current IP agreement and issues a license with a reference', async () => {
    const response = await sign({
      agreement_type: 'instructor_curriculum_ip',
      signer_name: 'David Nazario',
      signature_method: 'typed',
    });
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      ok: true,
      agreement_type: 'instructor_curriculum_ip',
      version: '1.0',
    });
    expect(payload.license_reference).toMatch(/^ELV-INST-[0-9A-F]{8}$/);
    expect(m.recordCalls).toHaveLength(1);
    expect(m.recordCalls[0]).toMatchObject({
      agreementType: 'instructor_curriculum_ip',
      documentVersion: '1.0',
      signerName: 'David Nazario',
      userId,
    });
    const status = await getInstructorCurriculumLicenseStatus(database(), userId, { courseId });
    expect(status).toMatchObject({ authorized: true, reason: 'ok' });
    expect((m.tables.license_audit_log ?? [])[0]).toMatchObject({
      action: 'instructor_curriculum_ip.signed',
    });
  });

  it('rejects a replay after revocation and renews only with the current form context', async () => {
    const body = { agreement_type: 'instructor_curriculum_ip', signer_name: 'QA Instructor', signature_method: 'typed' };
    expect((await sign(body)).status).toBe(200);
    const first = m.tables.instructor_curriculum_licenses[0];
    first.status = 'revoked'; first.revoked_at = '2026-11-25T00:00:00Z';
    expect((await sign(body)).status).toBe(500);
    expect(m.tables.instructor_curriculum_licenses).toHaveLength(1);
    const context = await licenseGet(new NextRequest(`${url}/curriculum-license`));
    expect((await context.json()).renewal_license_id).toBe(first.id);
    expect((await sign({ ...body, renewal_license_id: first.id })).status).toBe(200);
    expect(m.tables.instructor_curriculum_licenses).toHaveLength(2);
    expect(m.tables.instructor_curriculum_licenses[1].signature_receipt).toMatchObject({ renewalLicenseId: first.id });
  });
  it('rejects an old agreement-version submission before recording or issuing', async () => {
    expect((await sign({ agreement_type: 'instructor_curriculum_ip', agreement_version: '0.9', signer_name: 'QA' })).status).toBe(409);
    expect(m.recordCalls).toEqual([]);
    expect(m.tables.instructor_curriculum_licenses).toEqual([]);
  });
  it('signing the old general services agreement does NOT authorize the IP gate', async () => {
    const response = await sign({ signer_name: 'David Nazario' });
    expect(response.status).toBe(200);
    expect(m.upserts).toHaveLength(1);
    expect(m.upserts[0]).toMatchObject({ agreement_type: 'instructor_services' });
    expect(m.recordCalls).toHaveLength(0);
    expect(m.tables.instructor_curriculum_licenses).toHaveLength(0);
    const status = await getInstructorCurriculumLicenseStatus(database(), userId, { courseId });
    expect(status).toMatchObject({ authorized: false, reason: 'unsigned' });
  });

  it('refuses to self-license an admin through the instructor endpoint', async () => {
    m.auth = { id: adminId, user: { email: 'admin@example.com' }, error: null };
    const response = await sign({
      agreement_type: 'instructor_curriculum_ip',
      signer_name: 'Admin User',
    });
    expect(response.status).toBe(403);
    expect(m.tables.instructor_curriculum_licenses).toHaveLength(0);
  });

  it('requires a signer name and fails closed when recording fails', async () => {
    expect((await sign({ agreement_type: 'instructor_curriculum_ip' })).status).toBe(400);
    m.recordSuccess = false;
    const response = await sign({
      agreement_type: 'instructor_curriculum_ip',
      signer_name: 'David Nazario',
    });
    expect(response.status).toBe(400);
    expect(m.tables.instructor_curriculum_licenses).toHaveLength(0);
  });
});

describe('instructor curriculum license status and revocation route', () => {
  it('reports unsigned before signing and authorized after, and an admin can revoke', async () => {
    const before = await licenseGet(
      new NextRequest(`${url}/curriculum-license`),
    );
    expect(before.status).toBe(200);
    expect(await before.json()).toMatchObject({ authorized: false, reason: 'unsigned' });

    await sign({
      agreement_type: 'instructor_curriculum_ip',
      signer_name: 'David Nazario',
    });
    const after = await licenseGet(new NextRequest(`${url}/curriculum-license`));
    expect(await after.json()).toMatchObject({
      authorized: true,
      reason: 'ok',
      agreement_version: '1.0',
    });

    m.auth = { id: adminId, user: { email: 'admin@example.com' }, error: null };
    const revoked = await licensePost(
      new NextRequest(`${url}/curriculum-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, reason: 'Agreement violation' }),
      }),
    );
    expect(revoked.status).toBe(200);
    expect(await revoked.json()).toMatchObject({ ok: true, revoked: 1 });

    const status = await getInstructorCurriculumLicenseStatus(database(), userId, { courseId });
    expect(status).toMatchObject({ authorized: false, reason: 'revoked' });
  });

  it('refuses revocation by a non-admin and revocation without an active license', async () => {
    const asInstructor = await licensePost(
      new NextRequest(`${url}/curriculum-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, reason: 'x' }),
      }),
    );
    expect(asInstructor.status).toBe(403);
    m.auth = { id: adminId, user: { email: 'admin@example.com' }, error: null };
    const noLicense = await licensePost(
      new NextRequest(`${url}/curriculum-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, reason: 'x' }),
      }),
    );
    expect(noLicense.status).toBe(404);
  });
});
