// @vitest-environment node
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { load } from 'js-yaml';
import { describe, expect, it, vi } from 'vitest';
import { createQaAuthUser } from '../../scripts/qa/supabase-auth-fixtures.mjs';
import { hasApprovedPaidLearnerEnrollment, isApprovedPaidEnrollment } from '../../lib/learner/approved-paid-admission.mjs';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { assertOperationalPlacement, resolveApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';
import { buildHostStudentCertificates } from '@/lib/certificates/host-shop-student-records';
import { hostStudentCertificatePdf } from '@/lib/certificates/host-shop-student-pdf';

const fixtureSource = readFileSync('scripts/qa/provision-apprenticeship-e2e.mjs', 'utf8');
// Execute the actual provision/cleanup functions. Only external I/O is replaced;
// admission, registered-standard resolution and certificate generation stay real.
const fixtureBody = fixtureSource.slice(fixtureSource.indexOf('const action ='));
const standard = getRegisteredProgramStandard('barber-apprenticeship')!;
const programId = '11111111-1111-4111-8111-111111111111';
type Row = Record<string, any>;

function fixtureHarness(runId = '12345-2-4') {
  const tables: Record<string, Row[]> = {
    programs: [{ id: programId, slug: 'barber-apprenticeship', organization_id: 'qa-org', tenant_id: 'qa-tenant' }],
    apprenticeship_standard_versions: [{
      standard_key: 'qa-barber-standard-version', program_slug: 'barber-apprenticeship',
      rapids_code: standard.standard.rapidsCode, registration_number: standard.sponsor.registrationNumber,
      revision_date: '2026-01-01', is_active: true,
    }],
    program_courses: [{ program_id: programId, course_id: 'qa-barber-course', is_required: true, order_index: 1 }],
  };
  const users: Row[] = [];
  const files = new Map<string, string>();
  const writes: string[] = [];
  let sequence = 0;
  const db: any = {
    from(table: string) {
      tables[table] ??= [];
      const predicates: ((row: Row) => boolean)[] = [];
      let mode = 'select', payload: Row | undefined, maximum = Infinity, single = false;
      const query: any = {
        select: () => query,
        eq: (key: string, value: unknown) => { predicates.push(row => row[key] === value); return query; },
        in: (key: string, values: unknown[]) => { predicates.push(row => values.includes(row[key])); return query; },
        is: (key: string, value: unknown) => { predicates.push(row => value === null ? row[key] == null : row[key] === value); return query; },
        or: (expression: string) => {
          const alternatives = expression.split(',').map(clause => {
            const [key, operator, ...parts] = clause.split('.');
            const value = parts.join('.');
            return (row: Row) => operator === 'is' && value === 'null' ? row[key] == null : String(row[key]) === value;
          });
          predicates.push(row => alternatives.some(matches => matches(row)));
          return query;
        },
        order: () => query,
        limit: (value: number) => { maximum = value; return query; },
        insert: (row: Row) => { mode = 'insert'; payload = row; return query; },
        upsert: (row: Row) => { mode = 'upsert'; payload = row; return query; },
        delete: () => { mode = 'delete'; return query; },
        single: () => { single = true; return query; },
        maybeSingle: () => { single = true; return query; },
        then(resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) {
          try {
            let rows = tables[table].filter(row => predicates.every(matches => matches(row)));
            if (mode === 'insert' || mode === 'upsert') {
              const row = JSON.parse(JSON.stringify({ id: `qa-row-${++sequence}`, ...payload }));
              if (mode === 'upsert') tables[table] = tables[table].filter(existing => existing.id !== row.id);
              tables[table].push(row);
              rows = [row];
              writes.push(`${mode}:${table}`);
            } else if (mode === 'delete') {
              tables[table] = tables[table].filter(row => !rows.includes(row));
              writes.push(`delete:${table}`);
            }
            rows = rows.slice(0, maximum);
            return Promise.resolve({ data: single ? rows[0] ?? null : rows, error: null }).then(resolve, reject);
          } catch (error) { return Promise.reject(error).then(resolve, reject); }
        },
      };
      return query;
    },
    auth: { admin: {
      createUser: vi.fn(async (input: Row) => {
        const user = { id: `qa-auth-${++sequence}`, ...input };
        users.push(user);
        writes.push('auth:create');
        return { data: { user }, error: null };
      }),
      deleteUser: vi.fn(async (id: string, softDelete: boolean) => {
        expect(softDelete).toBe(true);
        users.find(user => user.id === id)!.deleted_at = new Date().toISOString();
        writes.push('auth:delete');
        return { error: null };
      }),
      getUserById: vi.fn(async (id: string) => ({ data: { user: users.find(user => user.id === id) }, error: null })),
    } },
  };
  const run = (action = 'provision', overrides: Record<string, string> = {}) => runInNewContext(
    `(async () => { ${fixtureBody}\n })()`, {
      createClient: () => db, createQaAuthUser, randomBytes, URL, setTimeout,
      process: { argv: ['node', 'provision-apprenticeship-e2e.mjs', action], env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://isdgjcdabhxxozarmxta.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'offline-test-key',
        GITHUB_RUN_ID: '12345', QA_PORTAL_E2E_RUN_ID: runId, GITHUB_ENV: 'github-env', ...overrides,
      } },
      console: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
      writePrivateQaState: async (path: string, state: unknown) => { files.set(path, JSON.stringify(state)); },
      writeFile: async (path: string, content: string) => { files.set(path, (files.get(path) || '') + content); },
      readFile: async (path: string) => {
        if (!files.has(path)) throw new Error('ENOENT');
        return files.get(path);
      },
    },
  ) as Promise<void>;
  const state = () => JSON.parse(files.get('.qa-apprenticeship-e2e-state.json')!);
  const exportedEnv = () => Object.fromEntries((files.get('github-env') || '').trim().split('\n').map(line => line.split('=')));
  return { run, tables, users, files, writes, db, state, exportedEnv };
}

describe('isolated apprentice and Host Shop fixtures used by desktop shards', () => {
  it('provisions both dedicated roles before every affected browser suite and retains independent cleanup', () => {
    const workflow: any = load(readFileSync('.github/workflows/e2e-desktop-chrome.yml', 'utf8'));
    const job = workflow.jobs['desktop-chrome-shard'];
    expect(job.strategy.matrix.shard).toEqual([1, 2, 3, 4]);
    expect(job.env.QA_PORTAL_E2E_RUN_ID).toBe('${{ github.run_id }}-${{ github.run_attempt }}-${{ matrix.shard }}');
    const steps: any[] = job.steps;
    const provision = steps.findIndex(step => step.run === 'node scripts/qa/provision-apprenticeship-e2e.mjs provision');
    const learner = steps.findIndex(step => step.run === 'node scripts/qa/provision-learner-program-holder-e2e.mjs provision');
    expect(provision).toBeGreaterThan(learner);
    expect(steps[provision].if).toBeUndefined();
    for (const index of steps.flatMap((step, index) => /playwright test|pnpm test:e2e/.test(step.run || '') ? [index] : [])) {
      expect(provision).toBeLessThan(index);
    }
    const cleanup = ['apprenticeship', 'learner-program-holder', 'remaining-portal'].map(name =>
      steps.findIndex(step => step.run === `node scripts/qa/provision-${name}-e2e.mjs cleanup`));
    expect(cleanup[0]).toBeGreaterThan(steps.findIndex(step => step.name === 'Run all cases in this desktop-chrome shard'));
    expect(cleanup[1]).toBeGreaterThan(cleanup[0]);
    expect(cleanup[2]).toBeGreaterThan(cleanup[1]);
    for (const index of cleanup) expect(steps[index].if).toBe('always()');
  });

  it('exports run-scoped dedicated credentials to both specs without borrowing another portal role', async () => {
    const first = fixtureHarness('12345-2-1'), fourth = fixtureHarness('12345-2-4');
    await first.run(); await fourth.run();
    for (const fixture of [first, fourth]) {
      const env = fixture.exportedEnv();
      const state = fixture.state();
      expect(Object.keys(env).sort()).toEqual(['E2E_APPRENTICE_EMAIL', 'E2E_APPRENTICE_PASSWORD', 'E2E_HOST_SHOP_EMAIL', 'E2E_HOST_SHOP_PASSWORD']);
      for (const [kind, prefix, role] of [['host', 'HOST_SHOP', 'host_shop'], ['apprentice', 'APPRENTICE', 'apprentice']]) {
        expect(env[`E2E_${prefix}_EMAIL`]).toBe(state[kind].email);
        expect(env[`E2E_${prefix}_PASSWORD`]).toBe(state[kind].password);
        expect(state[kind].email).toBe(`qa-e2e-${state.runId}-${kind}@qa.invalid`);
        const user = fixture.users.find(user => user.id === state[kind].id)!;
        expect(user.app_metadata).toMatchObject({ role, qa_e2e: true, qa_run_id: state.runId });
      }
    }
    expect(first.exportedEnv().E2E_HOST_SHOP_EMAIL).not.toBe(fourth.exportedEnv().E2E_HOST_SHOP_EMAIL);
    expect(first.exportedEnv().E2E_APPRENTICE_EMAIL).not.toBe(fourth.exportedEnv().E2E_APPRENTICE_EMAIL);
    for (const path of ['portal-responsive-design.spec.ts', 'registered-apprenticeship-authenticated.spec.ts']) {
      const source = readFileSync(`tests/e2e/${path}`, 'utf8');
      for (const variable of Object.keys(first.exportedEnv())) expect(source).toContain(`process.env.${variable}`);
    }
  });

  it('admits the generated apprentice through the real paid-admission gate while preserving denial rules', async () => {
    const fixture = fixtureHarness(); await fixture.run();
    const enrollment = fixture.tables.program_enrollments[0];
    expect(isApprovedPaidEnrollment(enrollment)).toBe(true);
    expect(await hasApprovedPaidLearnerEnrollment(fixture.db, fixture.state().apprentice.id)).toBe(true);
    expect(enrollment.draft_data).toMatchObject({ qa_e2e: true, qa_run_id: fixture.state().runId, disposable: true });
    for (const invalid of [
      { access_status: null }, { payment_status: 'qa_test' }, { self_pay_application_verified_at: null },
      { payment_reference: null }, { revoked_at: new Date().toISOString() },
    ]) expect(isApprovedPaidEnrollment({ ...enrollment, ...invalid })).toBe(false);
  });

  it('resolves its actual placement, supervisor and active registered competencies through the runtime contract', async () => {
    const fixture = fixtureHarness(); await fixture.run();
    const state = fixture.state();
    const runtime = await resolveApprenticeshipRuntimeContext(fixture.db, { enrollmentId: state.enrollmentId });
    expect(runtime).not.toBeNull();
    expect(assertOperationalPlacement(runtime!)).toBe(runtime);
    expect(runtime!.placement?.id).toBe(state.placementId);
    expect(runtime!.shop?.id).toBe(state.hostShopId);
    expect(runtime!.partner?.id).toBe(state.partnerId);
    expect(runtime!.supervisor?.id).toBe(state.host.id);
    expect(runtime!.contract?.standard.competencies.length).toBeGreaterThan(0);
    expect(runtime!.enrollment.course_id).toBe('qa-barber-course');
    expect(fixture.tables.partner_users[0]).toMatchObject({ user_id: state.host.id, partner_id: state.partnerId, role: 'supervisor', status: 'active' });
    expect(fixture.tables.shop_staff[0]).toMatchObject({ user_id: state.host.id, shop_id: state.shopId, active: true });
  });

  it('derives a real downloadable enrollment certificate from its assigned apprentice without awarding completion', async () => {
    const fixture = fixtureHarness(); await fixture.run();
    const placements = fixture.tables.apprentice_placements.map(row => ({
      ...row, name: fixture.tables.profiles.find(profile => profile.id === row.student_id)!.full_name,
    }));
    const records = buildHostStudentCertificates(fixture.tables.shops as any, placements as any, [], fixture.tables.program_enrollments as any);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: `placement-${fixture.state().placementId}`, status: 'enrolled', title: 'Certificate of Enrollment',
      studentId: fixture.state().apprentice.id, shopId: fixture.state().shopId,
    });
    expect(records[0].completion).toBeUndefined();
    const pdf = await hostStudentCertificatePdf(records[0]);
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('cleans only its checkpointed fixture and leaves canonical and unrelated records intact', async () => {
    const fixture = fixtureHarness(); await fixture.run();
    fixture.tables.profiles.push({ id: 'other-user', email: 'another-run@qa.invalid' });
    await fixture.run('cleanup');
    for (const table of ['partners', 'partner_users', 'shops', 'host_shops', 'shop_staff', 'program_enrollments', 'apprentice_placements']) {
      expect(fixture.tables[table]).toEqual([]);
    }
    expect(fixture.tables.profiles).toEqual([{ id: 'other-user', email: 'another-run@qa.invalid' }]);
    expect(fixture.tables.programs[0].id).toBe(programId);
    expect(fixture.tables.apprenticeship_standard_versions).toHaveLength(1);
    expect(fixture.users.every(user => Boolean(user.deleted_at))).toBe(true);
  });

  it('refuses cleanup before deleting anything when the placement gained regulated wage records', async () => {
    const fixture = fixtureHarness(); await fixture.run();
    fixture.tables.apprenticeship_wage_obligations = [{ id: 'retained-obligation', placement_id: fixture.state().placementId }];
    const before = fixture.writes.length;
    await expect(fixture.run('cleanup')).rejects.toThrow('retention review required');
    expect(fixture.writes).toHaveLength(before);
  });

  it('rejects the production database before any Auth or table mutation', async () => {
    const fixture = fixtureHarness();
    await expect(fixture.run('provision', { NEXT_PUBLIC_SUPABASE_URL: 'https://cuxzzpsyufcewtmicszk.supabase.co' }))
      .rejects.toThrow('only against the isolated QA project');
    expect(fixture.writes).toEqual([]);
    expect(fixture.files.size).toBe(0);
  });
});
