// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const state = vi.hoisted(() => ({
  tables: {} as Record<string, any[]>,
  queries: [] as any[],
  writes: [] as any[],
  actor: { id: 'reviewer-1', email: 'reviewer@fixture.test', role: 'admin' },
  denied: 0,
  failing: '',
  beforeUpdate: null as null | (() => void),
  createUser: vi.fn(), generateLink: vi.fn(), sendEmail: vi.fn(), contractor: vi.fn(), notify: vi.fn(),
}));

const applicationId = '11111111-1111-4111-8111-111111111111';
const programId = '22222222-2222-4222-8222-222222222222';
const originalUpdatedAt = '2026-11-24T15:00:00.000Z';
const program = { id: programId, slug: 'building-maintenance-wrg', title: 'Fixture verified program', is_active: true, status: 'active' };

function database() {
  return {
    auth: { admin: {
      createUser: state.createUser, generateLink: state.generateLink,
      listUsers: async () => ({ data: { users: [] }, error: null }),
    } },
    from(table: string) {
      const filters: Array<[string, unknown]> = [];
      let operation = 'select';
      let values: any;
      let singular = false;
      const execute = async () => {
        state.queries.push({ table, operation, filters: [...filters] });
        if (`${table}:${operation}` === state.failing) return { data: null, error: { message: 'Fixture database unavailable' } };
        const rows = state.tables[table] ||= [];
        if (operation === 'update' && state.beforeUpdate) {
          const before = state.beforeUpdate;
          state.beforeUpdate = null;
          before();
        }
        const matches = rows.filter(row => filters.every(([key, value]) => {
          const actual = key.split('->').reduce((data, field) => data?.[field], row);
          return Array.isArray(value) ? value.includes(actual) : value === null ? actual == null : actual === value;
        }));
        let result = matches;
        if (operation === 'insert' || operation === 'upsert') {
          result = (Array.isArray(values) ? values : [values]).map(value => ({ id: `fixture-${table}-${rows.length + 1}`, ...structuredClone(value) }));
          rows.push(...result);
          // Mirror the existing intake promotion trigger only within this fake database.
          if (table === 'application_intake') {
            const destination = state.tables.program_holder_applications.length ? '33333333-3333-4333-8333-333333333333' : applicationId;
            Object.assign(result[0], { status: 'processed', destination_table: 'program_holder_applications', destination_id: destination });
            state.tables.program_holder_applications.push({
              id: destination, status: 'pending', updated_at: originalUpdatedAt,
              organization_name: values.payload.organization_name, contact_name: values.payload.contact_name,
              email: values.payload.email, data: structuredClone(values.payload),
            });
          }
        } else if (operation === 'update') {
          for (const row of result) Object.assign(row, structuredClone(values));
        }
        if (operation !== 'select') state.writes.push({ table, operation, values: structuredClone(values), filters: [...filters], affected: result.length });
        if (singular && result.length > 1) return { data: null, error: { message: 'Multiple fixture records', code: 'PGRST116' } };
        return { data: singular ? result[0] ? structuredClone(result[0]) : null : structuredClone(result), error: null };
      };
      const query: any = {
        select: () => query,
        eq: (key: string, value: unknown) => { filters.push([key, value]); return query; },
        is: (key: string, value: unknown) => { filters.push([key, value]); return query; },
        in: (key: string, value: unknown[]) => { filters.push([key, value]); return query; },
        or: () => query, order: () => query, limit: () => query,
        insert: (value: unknown) => { operation = 'insert'; values = value; return query; },
        upsert: (value: unknown) => { operation = 'upsert'; values = value; return query; },
        update: (value: unknown) => { operation = 'update'; values = value; return query; },
        maybeSingle: () => { singular = true; return execute(); },
        single: () => { singular = true; return execute(); },
        then: (resolve: any, reject: any) => execute().then(resolve, reject),
      };
      return query;
    },
  };
}

vi.mock('@/lib/admin/guards', () => ({ apiRequireRoles: async (_request: Request, roles: string[]) => {
  if (state.denied) return { error: NextResponse.json({ error: 'Denied' }, { status: state.denied }) };
  return roles.includes(state.actor.role) ? state.actor : { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
} }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => database(), getAdminClient: async () => database() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/applications/submission-notifications', () => ({ notifyApplicationSubmission: state.notify }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: state.sendEmail }));
vi.mock('@/lib/integrations/quickbooks-program-holder-contractor', () => ({ ensureProgramHolderQuickBooksContractor: state.contractor }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

import { POST as submit } from '@/apps/marketing/app/api/program-holder/apply/route';
import { POST as resolveScope } from '@/apps/admin/app/api/program-holder/applications/[id]/resolve-scope/route';
import { POST as approve } from '@/apps/admin/app/api/program-holder/applications/[id]/approve/route';
import { programHolderApplicationScope, programHolderProgramSlugs, unresolvedProgramHolderInterest } from '@/lib/program-holder/program-interest';

const context = { params: Promise.resolve({ id: applicationId }) };
const reviewBody = () => ({ programId, note: 'Fixture review: training scope confirmed with the applicant.', confirmReviewed: true, expectedUpdatedAt: originalUpdatedAt });
function reviewRequest(body: Record<string, unknown> = reviewBody(), origin = 'https://admin.elevateforhumanity.org') {
  return new NextRequest(`https://admin.elevateforhumanity.org/api/program-holder/applications/${applicationId}/resolve-scope`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
  });
}
const approveRequest = () => new NextRequest(`https://admin.elevateforhumanity.org/api/program-holder/applications/${applicationId}/approve`, { method: 'POST' });
function pendingApplication() {
  return {
    id: applicationId, status: 'pending', updated_at: originalUpdatedAt,
    organization_name: 'Fixture organization', contact_name: 'Fixture Contact', email: 'owner@fixture.test',
    data: { requested_program_interest: 'janitorial', requested_program_slugs: [], notes: 'Original applicant note' },
  };
}
function boundIntake() {
  return {
    id: '44444444-4444-4444-8444-444444444444', application_type: 'program_holder',
    destination_table: 'program_holder_applications', destination_id: applicationId, status: 'processed',
    payload: structuredClone(pendingApplication().data),
  };
}
const submitRequest = (extra: Record<string, unknown> = {}) => new Request('https://www.elevateforhumanity.org/api/program-holder/apply', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
    organizationName: 'Fixture organization', contactName: 'Fixture Contact', email: 'owner@fixture.test',
    requestedProgramInterest: 'janitorial', requestedProgramSlugs: [], ...extra,
  }),
});
function expectNoProvisioning() {
  expect(state.createUser).not.toHaveBeenCalled();
  expect(state.generateLink).not.toHaveBeenCalled();
  expect(state.sendEmail).not.toHaveBeenCalled();
  expect(state.contractor).not.toHaveBeenCalled();
  expect(state.writes.filter(write => !['application_intake', 'program_holder_applications'].includes(write.table))).toEqual([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  state.tables = { program_holder_applications: [pendingApplication()], application_intake: [boundIntake()], programs: [{ ...program }] };
  state.queries = []; state.writes = []; state.denied = 0; state.failing = ''; state.beforeUpdate = null;
  state.actor = { id: 'reviewer-1', email: 'reviewer@fixture.test', role: 'admin' };
  state.createUser.mockResolvedValue({ data: { user: { id: 'fixture-user' } }, error: null });
  state.generateLink.mockResolvedValue({ data: { properties: { action_link: 'https://auth.fixture.test/verified-link' } }, error: null });
  state.sendEmail.mockResolvedValue({ success: true });
  state.contractor.mockResolvedValue({ linked: false });
  state.notify.mockResolvedValue({ applicant: 'sent', staff: 'sent' });
});

describe('program-holder scope decision', () => {
  it.each(['active', 'published'])('carries a %s catalog program through protected scope review into separate approval without changing original interest', async (status) => {
    state.tables.programs[0].status = status;
    state.tables.program_holder_applications = [];
    state.tables.application_intake = [];
    const submitted = await submit(submitRequest({ program_scope_review: { program_slug: 'untrusted-client-choice' } }));
    expect(submitted.status).toBe(201);
    expect(state.tables.program_holder_applications[0].data).not.toHaveProperty('program_scope_review');
    expect((await approve(approveRequest(), context)).status).toBe(409);
    expectNoProvisioning();

    const resolved = await resolveScope(reviewRequest(), context);
    expect(resolved.status).toBe(200);
    const application = state.tables.program_holder_applications[0];
    expect(application.status).toBe('pending');
    const intake = state.tables.application_intake[0];
    expect(application.data.program_scope_review).toBeUndefined();
    expect(intake.payload).toMatchObject({
      requested_program_interest: 'janitorial', requested_program_slugs: [],
      program_scope_review: { requested_interest: 'janitorial', program_id: programId, program_slug: program.slug, reviewed_by: 'reviewer-1', note: reviewBody().note },
    });
    expect(unresolvedProgramHolderInterest(programHolderApplicationScope(applicationId, application.data, intake))).toBe(false);
    expect(state.writes.at(-1).filters).toEqual(expect.arrayContaining([
      ['id', intake.id], ['application_type', 'program_holder'], ['destination_table', 'program_holder_applications'],
      ['destination_id', applicationId], ['status', 'processed'], ['payload->program_scope_review', null],
    ]));
    expectNoProvisioning();

    expect((await approve(approveRequest(), context)).status).toBe(200);
    expect(state.tables.program_holder_programs).toEqual([expect.objectContaining({ program_id: programId, program_slug: program.slug, status: 'active' })]);
    expect(application.data.requested_program_interest).toBe('janitorial');
    expect(application.data.requested_program_slugs).toEqual([]);
    expect(application.data.provisioned_program_slugs).toEqual([program.slug]);
    expect(state.createUser).toHaveBeenCalledTimes(1);
    expect(state.sendEmail).toHaveBeenCalledTimes(1);
  });

  it.each([
    { is_active: false }, { is_active: false, status: 'published' },
    { is_active: true, status: 'archived' }, { status: 'draft' },
    { status: 'inactive' }, { status: 'unpublished' }, { status: null },
    { slug: 'commercial-cleaning' }, { slug: 'BUILDING-MAINTENANCE-WRG' }, { id: 'missing-program' },
  ])('rejects unverified or unavailable catalog choice %j without a write', async (change) => {
    Object.assign(state.tables.programs[0], change);
    expect((await resolveScope(reviewRequest(), context)).status).toBe(409);
    expect(state.writes).toEqual([]);
    expectNoProvisioning();
  });

  it.each(['student', 'program_holder', 'staff', 'org_admin'])('does not expand scope-review authority to %s', async (role) => {
    state.actor.role = role;
    expect((await resolveScope(reviewRequest(), context)).status).toBe(403);
    expect(state.queries).toEqual([]);
  });

  it('rejects unauthenticated, cross-origin, unconfirmed and injected review requests', async () => {
    state.denied = 401;
    expect((await resolveScope(reviewRequest(), context)).status).toBe(401);
    state.denied = 0;
    expect((await resolveScope(reviewRequest(reviewBody(), 'https://untrusted.fixture.test'), context)).status).toBe(403);
    for (const input of [
      { ...reviewBody(), confirmReviewed: false }, { ...reviewBody(), note: ' ' },
      { ...reviewBody(), reviewed_by: 'another-user' }, { ...reviewBody(), expectedUpdatedAt: 'invalid' },
    ]) expect((await resolveScope(reviewRequest(input), context)).status).toBe(400);
    expect(state.queries).toEqual([]);
  });

  it.each(['approved', 'rejected', 'denied'])('does not change a %s application', async (status) => {
    state.tables.program_holder_applications[0].status = status;
    expect((await resolveScope(reviewRequest(), context)).status).toBe(409);
    expect(state.writes).toEqual([]);
  });

  it('rejects stale forms and concurrent status or review changes without overwriting them', async () => {
    expect((await resolveScope(reviewRequest({ ...reviewBody(), expectedUpdatedAt: '2026-11-23T15:00:00.000Z' }), context)).status).toBe(409);
    for (const change of [{ status: 'approved' }, { updated_at: '2026-11-24T16:00:00.000Z', data: { notes: 'Concurrent review' } }]) {
      state.tables.program_holder_applications = [pendingApplication()];
      state.tables.application_intake = [boundIntake()];
      state.beforeUpdate = () => Object.assign(state.tables.program_holder_applications[0], change);
      const result = await resolveScope(reviewRequest(), context);
      expect(result.status).toBe(409);
      expect((await result.json()).scopeRecorded).toBe(true);
      expect(state.tables.program_holder_applications[0]).toMatchObject(change);
      expect(state.writes.at(-1).table).toBe('application_intake');
    }
    expectNoProvisioning();
  });

  it('does not overwrite a competing protected review that wins the guarded write', async () => {
    const winningReview = { note: 'Another reviewer already recorded this decision.' };
    state.beforeUpdate = () => { state.tables.application_intake[0].payload.program_scope_review = winningReview; };
    expect((await resolveScope(reviewRequest(), context)).status).toBe(409);
    expect(state.tables.application_intake[0].payload.program_scope_review).toEqual(winningReview);
    expect(state.writes.at(-1).affected).toBe(0);
    expectNoProvisioning();
  });

  it('retains a recorded decision and its audit fields instead of allowing a replacement to race approval', async () => {
    expect((await resolveScope(reviewRequest(), context)).status).toBe(200);
    const application = state.tables.program_holder_applications[0];
    const recorded = structuredClone(state.tables.application_intake[0].payload);
    const response = await resolveScope(reviewRequest({ ...reviewBody(), expectedUpdatedAt: application.updated_at, note: 'Replacement review should not overwrite the recorded decision.' }), context);
    expect(response.status).toBe(409);
    expect(state.tables.application_intake[0].payload).toEqual(recorded);
    expect(state.writes).toHaveLength(1);
    expectNoProvisioning();
  });

  it.each([
    { is_active: false }, { status: 'archived' }, { status: 'draft' },
    { status: 'inactive' }, { status: 'unpublished' }, { id: 'replacement-program-id' },
  ])('revalidates the reviewed published program before any approval side effects: %j', async (change) => {
    state.tables.programs[0].status = 'published';
    expect((await resolveScope(reviewRequest(), context)).status).toBe(200);
    Object.assign(state.tables.programs[0], change);
    expect((await approve(approveRequest(), context)).status).toBe(409);
    expect(state.writes).toHaveLength(1);
    expectNoProvisioning();
  });

  it.each(['programs:select', 'application_intake:update'])('does not report a saved scope when %s fails', async (failing) => {
    state.failing = failing;
    expect((await resolveScope(reviewRequest(), context)).status).toBe(500);
    expect(state.tables.application_intake[0].payload.program_scope_review).toBeUndefined();
    expectNoProvisioning();
  });

  it('preserves ordinary canonical program choices and keeps unreviewed interests blocked', () => {
    expect(programHolderProgramSlugs({ requested_program_slugs: ['hvac-technician'] })).toEqual(['hvac-technician']);
    const data = { requested_program_interest: 'janitorial', requested_program_slugs: ['hvac-technician'] };
    expect(programHolderProgramSlugs(data)).toEqual([]);
    expect(unresolvedProgramHolderInterest(data)).toBe(true);
  });

  it('does not trust forged, copied or removed review fields in the applicant-writable application', async () => {
    expect((await resolveScope(reviewRequest(), context)).status).toBe(200);
    const copiedReview = structuredClone(state.tables.application_intake[0].payload.program_scope_review);
    delete state.tables.application_intake[0].payload.program_scope_review;
    for (const data of [
      { ...pendingApplication().data, program_scope_review: copiedReview },
      { requested_program_slugs: [program.slug], program_scope_review: copiedReview },
      { requested_program_slugs: ['hvac-technician'], intake_id: 'another-intake' },
      {},
    ]) {
      state.tables.program_holder_applications[0].data = data;
      expect((await approve(approveRequest(), context)).status).toBe(409);
    }
    expectNoProvisioning();
  });

  it('uses exact server-controlled intake binding and rejects swapped, ambiguous or failed evidence', async () => {
    const application = state.tables.program_holder_applications[0];
    for (const change of [
      { destination_id: 'another-application' }, { destination_table: 'staff_applications' },
      { application_type: 'employer' },
    ]) {
      state.tables.application_intake = [{ ...boundIntake(), ...change }];
      application.data.intake_id = state.tables.application_intake[0].id;
      expect((await resolveScope(reviewRequest(), context)).status).toBe(409);
      expect((await approve(approveRequest(), context)).status).toBe(409);
    }
    state.tables.application_intake = [boundIntake(), { ...boundIntake(), id: 'duplicate-intake' }];
    expect((await resolveScope(reviewRequest(), context)).status).toBe(500);
    expect((await approve(approveRequest(), context)).status).toBe(500);
    state.failing = 'application_intake:select';
    expect((await approve(approveRequest(), context)).status).toBe(500);
    expectNoProvisioning();
  });

  it('public submission retries cannot forge or replace the original protected decision', async () => {
    expect((await resolveScope(reviewRequest(), context)).status).toBe(200);
    const original = structuredClone(state.tables.application_intake[0]);
    const response = await submit(submitRequest({
      id: original.id, destination_id: applicationId,
      program_scope_review: { ...original.payload.program_scope_review, reviewed_by: 'attacker' },
      data: { program_scope_review: original.payload.program_scope_review },
    }));
    expect(response.status).toBe(201);
    expect(state.tables.application_intake[0]).toEqual(original);
    expect(state.tables.application_intake[1].payload).not.toHaveProperty('program_scope_review');
    expect(state.tables.application_intake[1].payload).not.toHaveProperty('data');
    expect(state.tables.application_intake[1].destination_id).not.toBe(applicationId);
    expectNoProvisioning();
  });

  it('legacy applications cannot attest scope review with a copied proof', async () => {
    expect((await resolveScope(reviewRequest(), context)).status).toBe(200);
    const application = state.tables.program_holder_applications[0];
    application.data.program_scope_review = state.tables.application_intake[0].payload.program_scope_review;
    state.tables.application_intake = [];
    expect((await approve(approveRequest(), context)).status).toBe(409);
    expectNoProvisioning();
  });

  it('retains separate approval for legacy canonical requests without an intake record', async () => {
    state.tables.application_intake = [];
    state.tables.program_holder_applications[0].data = { requested_program_slugs: [program.slug] };
    expect((await approve(approveRequest(), context)).status).toBe(200);
    expect(state.tables.program_holder_programs[0]).toMatchObject({ program_id: programId, program_slug: program.slug });
  });
});
