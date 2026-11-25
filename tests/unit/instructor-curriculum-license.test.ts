// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown>;
const m = vi.hoisted(() => ({
  tables: {} as Record<string, Row[]>,
  assigned: new Set<string>(),
  profileError: null as { message: string } | null,
  inserts: [] as Row[],
}));

vi.mock('@/lib/lms/instructor-course-access', () => ({
  isAssignedCourseInstructor: async (_db: unknown, userId: string, courseId: string) =>
    m.assigned.has(`${userId}:${courseId}`),
}));

import {
  INSTRUCTOR_CURRICULUM_IP_VERSION_HASHES,
  getInstructorCurriculumLicenseStatus,
  issueInstructorCurriculumLicense,
} from '@/lib/legal/instructorCurriculumLicense';

const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const courseId = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201';
const hash = INSTRUCTOR_CURRICULUM_IP_VERSION_HASHES['1.0'];

function database() {
  return {
    from(table: string) {
      const filters: [string, unknown][] = [];
      let orderDesc = false;
      let insertValues: Row | null = null;
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
        async maybeSingle() {
          if (insertValues) {
            const row = { id: `license-${m.inserts.length + 1}`, ...structuredClone(insertValues) };
            (m.tables[table] ??= []).push(row);
            m.inserts.push(row);
            return { data: structuredClone(row), error: null };
          }
          if (table === 'profiles' && m.profileError) {
            return { data: null, error: m.profileError };
          }
          const rows = [...(m.tables[table] ?? [])];
          if (orderDesc) rows.reverse();
          const found = rows.find((row) =>
            filters.every(([column, value]) => row[column] === value),
          );
          return { data: found ? structuredClone(found) : null, error: null };
        },
      };
      return query;
    },
  };
}

function seedAuthorized() {
  m.tables = {
    profiles: [{ id: userId, role: 'instructor' }],
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
    license_agreement_acceptances: [
      { id: 'acc-1', user_id: userId, agreement_type: 'instructor_curriculum_ip', document_version: '1.0' },
    ],
    instructor_curriculum_licenses: [
      {
        id: 'lic-1',
        user_id: userId,
        agreement_type: 'instructor_curriculum_ip',
        agreement_version: '1.0',
        status: 'active',
        license_reference: 'ELV-INST-ABCDEF01',
        scope: { course_ids: [courseId], program_ids: [] },
        created_at: '2026-11-25T00:00:00Z',
      },
    ],
  };
  m.assigned.add(`${userId}:${courseId}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  m.tables = {};
  m.assigned = new Set();
  m.profileError = null;
  m.inserts = [];
});

describe('instructor curriculum license status', () => {
  it('authorizes a licensed, assigned instructor for the HVAC course', async () => {
    seedAuthorized();
    const status = await getInstructorCurriculumLicenseStatus(database(), userId, { courseId });
    expect(status).toMatchObject({
      authorized: true,
      reason: 'ok',
      agreementVersion: '1.0',
      licenseReference: 'ELV-INST-ABCDEF01',
      licenseId: 'lic-1',
    });
    expect(status.assignedCourseIds).toContain(courseId);
  });

  it('denies an instructor who never signed the IP agreement', async () => {
    seedAuthorized();
    m.tables.license_agreement_acceptances = [];
    const status = await getInstructorCurriculumLicenseStatus(database(), userId, { courseId });
    expect(status).toMatchObject({ authorized: false, reason: 'unsigned' });
  });

  it('does not let the old general instructor services agreement satisfy the IP gate', async () => {
    seedAuthorized();
    m.tables.license_agreement_acceptances = [
      { id: 'acc-old', user_id: userId, agreement_type: 'instructor_services', document_version: '1.0' },
    ];
    const status = await getInstructorCurriculumLicenseStatus(database(), userId, { courseId });
    expect(status).toMatchObject({ authorized: false, reason: 'unsigned' });
  });

  it('denies a signed instructor whose license was revoked', async () => {
    seedAuthorized();
    (m.tables.instructor_curriculum_licenses[0] as Row).status = 'revoked';
    const status = await getInstructorCurriculumLicenseStatus(database(), userId, { courseId });
    expect(status).toMatchObject({ authorized: false, reason: 'revoked' });
  });

  it('denies a signed instructor with no license row', async () => {
    seedAuthorized();
    m.tables.instructor_curriculum_licenses = [];
    const status = await getInstructorCurriculumLicenseStatus(database(), userId, { courseId });
    expect(status).toMatchObject({ authorized: false, reason: 'no_license' });
  });

  it('denies a licensed instructor with no assignment for the course', async () => {
    seedAuthorized();
    m.assigned.clear();
    const status = await getInstructorCurriculumLicenseStatus(database(), userId, { courseId });
    expect(status).toMatchObject({ authorized: false, reason: 'no_assignment' });
  });

  it('fails closed on a newer published version the code does not know', async () => {
    seedAuthorized();
    (m.tables.agreement_versions[0] as Row).version = '2.0';
    (m.tables.agreement_versions[0] as Row).current_version = '2.0';
    const status = await getInstructorCurriculumLicenseStatus(database(), userId, { courseId });
    expect(status).toMatchObject({ authorized: false, reason: 'stale_version', agreementVersion: '2.0' });
  });

  it('fails closed when the published text changed under the same version', async () => {
    seedAuthorized();
    (m.tables.agreement_versions[0] as Row).document_hash = 'deadbeef'.repeat(8);
    const status = await getInstructorCurriculumLicenseStatus(database(), userId, { courseId });
    expect(status).toMatchObject({ authorized: false, reason: 'hash_mismatch' });
  });

  it('denies non-instructors and fails closed on database errors', async () => {
    seedAuthorized();
    (m.tables.profiles[0] as Row).role = 'student';
    expect(
      await getInstructorCurriculumLicenseStatus(database(), userId, { courseId }),
    ).toMatchObject({ authorized: false, reason: 'not_instructor' });
    (m.tables.profiles[0] as Row).role = 'instructor';
    m.profileError = { message: 'Database unavailable' };
    expect(await getInstructorCurriculumLicenseStatus(database(), userId, { courseId })).toMatchObject({
      authorized: false,
      reason: 'unavailable',
    });
  });

  it('falls back to the code-pinned version when no version row is published yet', async () => {
    seedAuthorized();
    m.tables.agreement_versions = [];
    const status = await getInstructorCurriculumLicenseStatus(database(), userId, { courseId });
    expect(status).toMatchObject({ authorized: true, reason: 'ok', agreementVersion: '1.0' });
  });
});

describe('issueInstructorCurriculumLicense', () => {
  it('returns the existing active license unchanged instead of issuing a second one', async () => {
    seedAuthorized();
    const result = await issueInstructorCurriculumLicense(database(), {
      userId,
      agreementVersion: '1.0',
      agreementHash: hash,
      scopeCourseIds: [courseId],
      programIds: [],
    });
    expect(result).toEqual({
      licenseReference: 'ELV-INST-ABCDEF01',
      licenseId: 'lic-1',
      alreadyActive: true,
    });
    expect(m.inserts).toHaveLength(0);
  });

  it('issues a new license with a pseudonymous reference when none is active', async () => {
    seedAuthorized();
    m.tables.instructor_curriculum_licenses = [];
    const result = await issueInstructorCurriculumLicense(database(), {
      userId,
      agreementVersion: '1.0',
      agreementHash: hash,
      scopeCourseIds: [courseId],
      programIds: ['22222222-2222-4222-8222-222222222222'],
    });
    expect(result.alreadyActive).toBe(false);
    expect(result.licenseReference).toMatch(/^ELV-INST-[0-9A-F]{8}$/);
    expect(m.inserts).toHaveLength(1);
    expect(m.inserts[0]).toMatchObject({
      user_id: userId,
      agreement_type: 'instructor_curriculum_ip',
      agreement_version: '1.0',
      agreement_hash: hash,
      status: 'active',
      scope: {
        course_ids: [courseId],
        program_ids: ['22222222-2222-4222-8222-222222222222'],
      },
    });
  });
});
