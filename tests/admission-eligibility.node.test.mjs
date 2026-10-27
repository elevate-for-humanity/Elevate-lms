import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Exercise the approval pipeline with database/auth boundaries replaced, not a
// duplicate implementation of its admission or eligibility decisions.
const source = readFileSync(new URL('../lib/enrollment/approve.ts', import.meta.url), 'utf8');
const executable = stripTypeScriptTypes(source.replace(/^import .*;\n/gm, '')).replace(/^export /gm, '');
const approve = new Function('logger', 'attachPartnerRouting', 'cachePortalTypeForEnrollment',
  'ensureDigitalBinder', `${executable}\nreturn approveApplication;`)(
  { info() {}, warn() {}, error() {} }, async () => {}, async () => {},
  async () => ({ binderId: 'binder' }),
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
          table === 'profiles' ? { id: 'learner' } : { id: 'enrollment' }, error: null }); },
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
