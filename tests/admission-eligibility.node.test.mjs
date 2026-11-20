import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Exercise the approval pipeline with database/auth boundaries replaced, not a
// duplicate implementation of its admission or eligibility decisions.
const source = readFileSync(new URL('../lib/enrollment/approve.ts', import.meta.url), 'utf8');
const executable = stripTypeScriptTypes(source.replace(/^import .*;\n/gm, '')).replace(/^export /gm, '');
const approve = new Function('logger', 'attachPartnerRouting', 'cachePortalTypeForEnrollment',
  'ensureDigitalBinder', 'randomBytes', 'PLATFORM_DEFAULTS', 'resolveServerSupabaseRawEnv',
  `${executable}\nreturn approveApplication;`)(
  { info() {}, warn() {}, error() {} }, async () => {}, async () => {},
  async () => ({ binderId: 'binder' }),
  () => Buffer.from('0123456789abcdef'),
  { siteUrl: 'https://example.test' },
  () => ({ url: 'https://cuxzzpsyufcewtmicszk.supabase.co' }),
);

for (const eligibility of ['incomplete', 'conditional_review', 'eligible', 'ineligible', null]) {
  test(`admission preserves independently reviewed eligibility: ${eligibility}`, async () => {
    const application = {
      id: 'application', status: 'under_review', email: 'learner@example.test',
      program_id: 'program', program_slug: 'bookkeeping', eligibility_status: eligibility,
      funding_verified: false, has_workone_approval: false,
    };
    const writes = [];
    const db = { from(table) {
      let operation;
      const query = {
        select() { return query; }, eq() { return query; }, in() { return query; },
        update(payload) { operation = payload; writes.push({ table, payload }); return query; },
        upsert() { return query; },
        maybeSingle() { return Promise.resolve({ data: table === 'applications' ? application :
          table === 'profiles' ? { id: 'learner', tenant_id: 'tenant' } :
          table === 'programs' ? { slug: 'bookkeeping', tenant_id: 'tenant' } :
          { id: 'enrollment' }, error: null }); },
        then(resolve, reject) {
          if (table === 'applications' && operation) Object.assign(application, operation);
          return Promise.resolve({ data: [], error: null }).then(resolve, reject);
        },
      };
      return query;
    } };
    const result = await approve(db, { applicationId: application.id, programId: 'program', bypassPaymentGate: true });
    assert.equal(result.success, true);
    assert.equal(result.enrollmentId, 'enrollment');
    assert.equal(application.status, 'approved');
    assert.equal(application.eligibility_status, eligibility);
    assert.equal(application.funding_verified, false);
    assert.equal(application.has_workone_approval, false);
    assert.ok(writes.some(write => write.table === 'profiles' && write.payload.enrollment_status === 'active'));
  });
}


test('new learner profile inherits canonical program tenant before enrollment', async () => {
  const application = {
    id: 'application',
    status: 'under_review',
    email: 'new-learner@example.test',
    first_name: 'New',
    last_name: 'Learner',
    program_id: 'program',
    program_slug: 'hvac-technician',
    funding_verified: false,
    has_workone_approval: false,
  };
  const writes = [];
  let authCreateCount = 0;
  const db = {
    auth: {
      admin: {
        async listUsers() {
          return { data: { users: [] }, error: null };
        },
        async createUser() {
          authCreateCount += 1;
          return { data: { user: { id: 'new-learner' } }, error: null };
        },
        async generateLink() {
          return { data: { properties: { action_link: 'https://example.test/recover' } }, error: null };
        },
        async deleteUser() {
          return { error: null };
        },
      },
    },
    from(table) {
      let operation;
      const query = {
        select() { return query; },
        eq() { return query; },
        in() { return query; },
        limit() { return query; },
        update(payload) {
          operation = payload;
          writes.push({ table, operation: 'update', payload });
          return query;
        },
        upsert(payload) {
          operation = payload;
          writes.push({ table, operation: 'upsert', payload });
          return query;
        },
        maybeSingle() {
          if (table === 'applications') return Promise.resolve({ data: application, error: null });
          if (table === 'profiles') return Promise.resolve({ data: null, error: null });
          if (table === 'programs') {
            return Promise.resolve({
              data: { slug: 'hvac-technician', tenant_id: 'tenant-qa' },
              error: null,
            });
          }
          if (table === 'program_enrollments') {
            return Promise.resolve({ data: { id: 'enrollment' }, error: null });
          }
          if (table === 'stripe_sessions_staging') {
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        },
        then(resolve, reject) {
          if (table === 'applications' && operation) Object.assign(application, operation);
          return Promise.resolve({ data: [], error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };

  const result = await approve(db, {
    applicationId: application.id,
    programId: 'program',
    bypassPaymentGate: true,
  });

  assert.equal(result.success, true);
  assert.equal(authCreateCount, 1);
  const profileWrite = writes.find(
    (write) => write.table === 'profiles' && write.operation === 'upsert',
  );
  assert.equal(profileWrite.payload.tenant_id, 'tenant-qa');
  assert.equal(profileWrite.payload.id, 'new-learner');
  assert.ok(
    writes.some(
      (write) =>
        write.table === 'program_enrollments' &&
        write.payload.program_id === 'program' &&
        write.payload.user_id === 'new-learner',
    ),
  );
});


test('nonstudent approval without a program uses the authorized primary tenant', async () => {
  const application = {
    id: 'employer-application',
    status: 'under_review',
    email: 'employer@example.test',
    first_name: 'Test',
    last_name: 'Employer',
    funding_verified: false,
    has_workone_approval: false,
  };
  const writes = [];
  const db = {
    auth: {
      admin: {
        async listUsers() {
          return { data: { users: [] }, error: null };
        },
        async createUser() {
          return { data: { user: { id: 'new-employer' } }, error: null };
        },
        async generateLink() {
          return { data: { properties: { action_link: 'https://example.test/recover' } }, error: null };
        },
        async deleteUser() {
          return { error: null };
        },
      },
    },
    from(table) {
      let operation;
      const query = {
        select() { return query; },
        eq() { return query; },
        in() { return query; },
        limit() { return query; },
        update(payload) {
          operation = payload;
          writes.push({ table, operation: 'update', payload });
          return query;
        },
        upsert(payload) {
          operation = payload;
          writes.push({ table, operation: 'upsert', payload });
          return query;
        },
        maybeSingle() {
          if (table === 'applications') return Promise.resolve({ data: application, error: null });
          if (table === 'tenants') {
            return Promise.resolve({ data: { id: 'primary-tenant' }, error: null });
          }
          if (table === 'profiles' || table === 'stripe_sessions_staging') {
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        },
        then(resolve, reject) {
          if (table === 'applications' && operation) Object.assign(application, operation);
          return Promise.resolve({ data: [], error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };

  const result = await approve(db, {
    applicationId: application.id,
    role: 'employer',
    bypassPaymentGate: true,
  });

  assert.equal(result.success, true);
  assert.equal(result.enrollmentId, null);
  const profileWrite = writes.find(
    (write) => write.table === 'profiles' && write.operation === 'upsert',
  );
  assert.equal(profileWrite.payload.tenant_id, 'primary-tenant');
  assert.equal(profileWrite.payload.role, 'employer');
  assert.equal(
    writes.some((write) => write.table === 'program_enrollments'),
    false,
  );
});
