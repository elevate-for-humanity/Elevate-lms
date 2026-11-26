// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync('scripts/qa/provision-learner-program-holder-e2e.mjs', 'utf8');
const cleanup = source.slice(source.indexOf('async function cleanup() {'), source.indexOf("\nif (action === 'provision')"));
const mustHelper = source.slice(source.indexOf('async function must('), source.indexOf('\n', source.indexOf('async function must(')));
const runId = '12345-2-4', marker = `qa-portal-e2e-${runId}`;
const courseId = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201';
type Row = Record<string, any>;

function harness() {
  const state: Row = { runId, marker, qaProgramId: 'program', holderId: 'holder', holderProgramId: 'link', hvacEnrollmentId: 'hvac', holderEnrollmentId: 'holder-enrollment' };
  const users: Row[] = [];
  const profiles: Row[] = [];
  for (const [key, kind, role] of [['learner', 'learner', 'student'], ['programHolder', 'program-holder', 'program_holder'], ['holderStudent', 'holder-student', 'student']]) {
    const email = `${marker}-${kind}@qa.invalid`;
    state[key] = { id: key, email };
    users.push({ id: key, email, app_metadata: { qa_e2e: true, qa_run_id: runId, role } });
    profiles.push({ id: key, email: key === 'holderStudent' ? `${marker}-${kind}@roster.qa.invalid` : email,
      role, program_holder_id: key === 'programHolder' ? 'holder' : null });
  }
  const tables: Record<string, Row[]> = {
    programs: [{ id: 'program', slug: `${marker}-program`, category: 'qa' }],
    program_holders: [{ id: 'holder', user_id: 'programHolder', primary_program_id: 'program', features: { qa_e2e: true, qa_run_id: runId } }],
    program_holder_programs: [{ id: 'link', program_holder_id: 'holder', program_id: 'program' }],
    program_enrollments: [
      { id: 'hvac', user_id: 'learner', student_id: 'learner', course_id: courseId, source: 'qa-e2e' },
      { id: 'holder-enrollment', user_id: 'holderStudent', student_id: 'holderStudent', program_id: 'program', program_holder_id: 'holder', source: 'qa-e2e' },
    ],
    profiles,
    program_holder_reports: [
      { id: 'report', program_holder_id: 'holder', user_id: 'programHolder', report_type: 'student_progress', metadata: { enrollment_id: 'holder-enrollment' } },
      { id: 'other-report', program_holder_id: 'other-holder', user_id: 'other-user', report_type: 'student_progress', metadata: { enrollment_id: 'other-enrollment' } },
    ],
    course_enrollments: [{ id: 'course-enrollment', student_id: 'learner' }, { id: 'other-course-enrollment', student_id: 'other-user' }],
  };
  const errors: Record<string, string> = {};
  const writes: string[] = [];
  const keepRows = new Set<string>();
  let authError: Row | null = null;
  const db = {
    from(table: string) {
      tables[table] ??= [];
      const predicates: ((row: Row) => boolean)[] = [];
      let mode = '', one = false, patch: Row = {};
      const query: any = {
        select: () => { mode ||= 'select'; return query; },
        delete: () => { mode = 'delete'; return query; },
        update: (value: Row) => { mode = 'update'; patch = value; return query; },
        eq: (column: string, value: unknown) => {
          if (!mode) throw new Error('PostgREST requires select/update/delete before filters');
          predicates.push(row => row[column] === value); return query;
        },
        contains: (column: string, value: Row) => { predicates.push(row => Object.entries(value).every(([key, expected]) => row[column]?.[key] === expected)); return query; },
        like: (column: string, pattern: string) => {
          if (!mode) throw new Error('PostgREST requires select/update/delete before filters');
          const regex = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')}$`);
          predicates.push(row => typeof row[column] === 'string' && regex.test(row[column])); return query;
        },
        limit: () => query,
        maybeSingle: () => { one = true; return query; },
        then(resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) {
          const rows = tables[table].filter(row => predicates.every(matches => matches(row)));
          const message = errors[`${mode}:${table}`];
          if (mode !== 'select') writes.push(`${mode}:${table}`);
          if (message) return Promise.resolve({ data: null, error: { message } }).then(resolve, reject);
          if (mode === 'delete' && !keepRows.has(table)) tables[table] = tables[table].filter(row => !rows.includes(row));
          if (mode === 'update') for (const row of rows) Object.assign(row, patch);
          return Promise.resolve({ data: one ? rows[0] ?? null : rows, error: null }).then(resolve, reject);
        },
      };
      return query;
    },
    auth: { admin: {
      getUserById: vi.fn(async (id: string) => {
        if (authError) return { data: null, error: authError };
        const user = users.find(user => user.id === id);
        return user ? { data: { user }, error: null } : { data: { user: null }, error: { status: 404, code: 'user_not_found' } };
      }),
      deleteUser: vi.fn(async (id: string, softDelete: boolean) => {
        expect(softDelete).toBe(true); writes.push('auth:delete');
        if (errors['auth:delete']) return { error: { status: 500, message: errors['auth:delete'] } };
        const user = users.find(user => user.id === id);
        if (!user) return { error: { status: 404, code: 'user_not_found', message: 'User not found' } };
        // GoTrue may redact soft-deleted identity metadata. Replay must not
        // mistake that for a live account with forged QA authority.
        Object.assign(user, { deleted_at: '2026-11-24T00:00:00Z', email: null, app_metadata: {} });
        return { error: null };
      }),
    } },
  };
  const run = () => runInNewContext(`(async () => { ${mustHelper}\n${cleanup}\n await cleanup(); })()`, {
    db, statePath: 'private-state', QA_HVAC_COURSE_ID: courseId, marker, runId,
    readFile: async () => JSON.stringify(state), console: { log: vi.fn() },
  }) as Promise<void>;
  return { run, state, tables, users, writes, errors, keepRows, db, setAuthError: (error: Row) => { authError = error; } };
}

describe('run-owned Program Holder fixture cleanup', () => {
  it('removes the actual report before its enrollment and preserves unrelated records', async () => {
    const f = harness(); await f.run();
    expect(f.tables.program_holder_reports.map(row => row.id)).toEqual(['other-report']);
    expect(f.tables.course_enrollments.map(row => row.id)).toEqual(['other-course-enrollment']);
    for (const table of ['programs', 'program_holders', 'program_holder_programs', 'program_enrollments', 'profiles']) expect(f.tables[table]).toEqual([]);
    expect(f.users.every(user => user.deleted_at)).toBe(true);
    const report = f.writes.indexOf('delete:program_holder_reports');
    expect(report).toBeGreaterThan(0);
    expect(report).toBeLessThan(f.writes.lastIndexOf('delete:program_enrollments'));
    expect(f.writes.indexOf('update:profiles')).toBeLessThan(f.writes.indexOf('delete:program_holders'));
  });

  it('safely replays after successful internal cleanup and redacted soft-deleted Auth accounts', async () => {
    const f = harness(); await f.run();
    const before = f.writes.length;
    await f.run();
    expect(f.writes).toHaveLength(before);
  });

  it.each(['program', 'holder', 'link', 'enrollment', 'profile', 'auth'])('rejects a mismatched %s before any writes', async kind => {
    const f = harness();
    if (kind === 'program') f.tables.programs[0].slug = 'real-program';
    if (kind === 'holder') f.tables.program_holders[0].features.qa_run_id = 'other-run';
    if (kind === 'link') f.tables.program_holder_programs[0].program_id = 'other-program';
    if (kind === 'enrollment') f.tables.program_enrollments[1].student_id = 'other-student';
    if (kind === 'profile') f.tables.profiles[2].email = 'real-student@example.invalid';
    if (kind === 'auth') f.users[0].app_metadata.qa_e2e = false;
    await expect(f.run()).rejects.toThrow('rejected mismatched');
    expect(f.writes).toEqual([]);
  });

  it('can finish a partial teardown with missing Auth only when all remaining owned bindings verify', async () => {
    const f = harness(); f.users.splice(2, 1);
    await f.run();
    expect(f.tables.program_enrollments).toEqual([]);
    expect(f.tables.profiles).toEqual([]);
    expect(f.db.auth.admin.deleteUser).not.toHaveBeenCalledWith('holderStudent', true);
  });

  it('rejects a mismatched remaining profile even when its Auth account is already missing', async () => {
    const f = harness(); f.users.splice(2, 1); f.tables.profiles[2].role = 'admin';
    await expect(f.run()).rejects.toThrow('holder-student profile');
    expect(f.writes).toEqual([]);
  });

  it('does not treat a transient Auth failure as an absent identity', async () => {
    const f = harness(); f.setAuthError({ status: 503, message: 'Auth unavailable' });
    await expect(f.run()).rejects.toThrow('Auth unavailable');
    expect(f.writes).toEqual([]);
  });

  it('propagates a record read failure before any deletion', async () => {
    const f = harness(); f.errors['select:program_holders'] = 'query unavailable';
    await expect(f.run()).rejects.toThrow('query unavailable');
    expect(f.writes).toEqual([]);
  });

  it.each(['program_holder_reports', 'program_holder_programs', 'program_holders', 'programs'])('fails on %s deletion errors instead of certifying teardown', async table => {
    const f = harness(); f.errors[`delete:${table}`] = 'dependency prevents deletion';
    await expect(f.run()).rejects.toThrow('dependency prevents deletion');
    expect(f.tables[table].length).toBeGreaterThan(0);
    expect(f.db.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it('can retry after a partial Auth cleanup failure without replaying deleted resources', async () => {
    const f = harness(); f.errors['auth:delete'] = 'temporary auth outage';
    await expect(f.run()).rejects.toThrow('temporary auth outage');
    delete f.errors['auth:delete'];
    await f.run();
    expect(f.tables.profiles).toEqual([]);
    expect(f.users.every(user => user.deleted_at)).toBe(true);
  });

  it('verifies actual teardown rather than trusting a successful delete response', async () => {
    const f = harness(); f.keepRows.add('programs');
    await expect(f.run()).rejects.toThrow('QA cleanup incomplete: programs');
  });
});
