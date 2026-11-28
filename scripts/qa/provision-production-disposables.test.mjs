import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isApprovedPaidEnrollment } from '../../lib/learner/approved-paid-admission.mjs';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const scripts = [
  'provision-remaining-portal-e2e.mjs',
  'provision-learner-program-holder-e2e.mjs',
  'provision-apprenticeship-e2e.mjs',
];

const PRODUCTION_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const QA_URL = 'https://isdgjcdabhxxozarmxta.supabase.co';
const OTHER_URL = 'https://example.supabase.co';
const GUARD_MESSAGE = 'only against the isolated QA project';

/**
 * Run a provision script as a subprocess with a fake service key. The fake
 * key means nothing is ever created: with the guard in the way the script
 * exits at the guard; past the guard it fails at the first Supabase call.
 * The parent environment's real credentials are never inherited.
 */
function runScript(script, extraEnv) {
  return spawnSync(process.execPath, [join(scriptsDir, script), 'provision'], {
    cwd: scriptsDir,
    timeout: 30_000,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH || '',
      NEXT_PUBLIC_SUPABASE_URL: PRODUCTION_URL,
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      ...extraEnv,
    },
  });
}

function output(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

function readScript(name) {
  return readFileSync(join(scriptsDir, name), 'utf8');
}

// Extract a flat top-level `const <name> = { ... };` literal by brace
// counting. Only used for objects with no nested braces or template
// literals (the production payment object qualifies).
function extractObjectLiteral(source, constName) {
  const start = source.indexOf(`const ${constName} = {`);
  assert.ok(start >= 0, `expected ${constName} in source`);
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`could not extract ${constName}`);
}

// The learner gate (lib/learner/approved-paid-admission.mjs) is the
// admission authority for the apprentice/learner surfaces. These tests
// prove the production-disposable enrollment shape passes it, and that
// each half of the shape is load-bearing: waived alone (no approval) and
// voucher funding alone (no approval) both fail.
const baseRow = {
  status: 'active',
  access_status: 'active',
  access_granted_at: new Date().toISOString(),
  revoked_at: null,
  cancelled_at: null,
  suspended_at: null,
  refunded_at: null,
  eligibility_status: null,
};

test('gate: production-disposable apprenticeship enrollment (waived + fixture approval) passes', () => {
  const row = {
    ...baseRow,
    payment_status: 'waived',
    funding_source: 'SELF_PAY',
    funding_verified: false,
    approved_at: new Date().toISOString(),
    approved_by: '00000000-0000-0000-0000-000000000001',
  };
  assert.equal(isApprovedPaidEnrollment(row), true);
});

test('gate: waived enrollment without approval does NOT pass (approval is load-bearing)', () => {
  const row = {
    ...baseRow,
    payment_status: 'waived',
    funding_source: 'SELF_PAY',
    funding_verified: false,
  };
  assert.equal(isApprovedPaidEnrollment(row), false);
});

test('gate: paid enrollment without payment reference or approval does NOT pass', () => {
  const row = {
    ...baseRow,
    payment_status: 'paid',
    funding_source: 'SELF_PAY',
    funding_verified: false,
  };
  assert.equal(isApprovedPaidEnrollment(row), false);
});

test('gate: production-disposable learner enrollment (waived + approval) passes', () => {
  const row = {
    ...baseRow,
    payment_status: 'waived',
    funding_source: 'qa-e2e',
    funding_verified: false,
    approved_at: new Date().toISOString(),
    approved_by: '00000000-0000-0000-0000-000000000001',
  };
  assert.equal(isApprovedPaidEnrollment(row), true);
});

test('gate: voucher-funded enrollment with approval passes (documented alternative, not used)', () => {
  const row = {
    ...baseRow,
    payment_status: 'waived',
    funding_source: 'wioa',
    funding_verified: true,
    approved_at: new Date().toISOString(),
    approved_by: '00000000-0000-0000-0000-000000000001',
  };
  assert.equal(isApprovedPaidEnrollment(row), true);
});

test('gate: voucher-funded enrollment without approval does NOT pass', () => {
  const row = {
    ...baseRow,
    payment_status: 'waived',
    funding_source: 'wioa',
    funding_verified: true,
  };
  assert.equal(isApprovedPaidEnrollment(row), false);
});

test('gate: QA apprenticeship enrollment (paid + verified self-pay) still passes', () => {
  const row = {
    ...baseRow,
    payment_status: 'paid',
    funding_source: 'SELF_PAY',
    funding_verified: false,
    self_pay_application_verified_at: new Date().toISOString(),
    payment_reference: 'qa-e2e-123',
  };
  assert.equal(isApprovedPaidEnrollment(row), true);
});

test('provision-apprenticeship-e2e.mjs: production payment is waived with fixture approval and no payment reference', () => {
  const source = readScript('provision-apprenticeship-e2e.mjs');
  const production = extractObjectLiteral(source, 'productionPayment');
  assert.match(production, /payment_status:\s*'waived'/);
  // Production program_enrollments_funding_status_check excludes 'waived'.
  // Waiver is a payment state only; no synthetic funding claim is permitted.
  assert.match(production, /funding_status:\s*'unfunded_self_continuing'/);
  assert.doesNotMatch(production, /funding_status:\s*'waived'/);
  assert.match(production, /approved_by:/);
  assert.doesNotMatch(production, /payment_reference/);
  assert.doesNotMatch(production, /self_pay_application_verified_at/);
  assert.doesNotMatch(production, /'paid'/);
  assert.ok(source.includes('isProductionDisposable ? productionPayment : qaPayment'));
});

test('provision-apprenticeship-e2e.mjs: cleanup deletes every trigger-derived row', () => {
  const source = readScript('provision-apprenticeship-e2e.mjs');
  const deletes = (table) => new RegExp(`db\\.from\\('${table}'\\)\\s*\\.delete\\(\\)`).test(source);
  for (const table of ['course_enrollments', 'program_holder_students', 'rapids_action_queue', 'staff_notifications', 'notification_outbox', 'platform_events']) {
    assert.ok(deletes(table), `cleanup should delete ${table}`);
  }
  // The audit trail is intentionally retained, never deleted.
  assert.ok(!source.includes(`db.from('enrollment_insert_audit').delete()`));
});

test('provision-learner-program-holder-e2e.mjs: production enrollments are waived, not paid', () => {
  const source = readScript('provision-learner-program-holder-e2e.mjs');
  assert.ok(source.includes(`const paymentStatus = isProductionDisposable ? 'waived' : 'paid';`));
  assert.ok(source.includes('payment_status: paymentStatus'));
  assert.ok(!source.includes(`payment_status: 'paid'`), 'no hardcoded paid enrollment should remain');
  // Production mode never resolves a real administrator as approver.
  assert.ok(source.includes(`like('email', '%@qa.invalid')`));
});

test('provision-learner-program-holder-e2e.mjs: cleanup deletes trigger-derived rows for both enrollments', () => {
  const source = readScript('provision-learner-program-holder-e2e.mjs');
  const deletes = (table) => new RegExp(`db\\.from\\('${table}'\\)\\s*\\.delete\\(\\)`).test(source);
  for (const table of ['course_enrollments', 'program_holder_students', 'notification_outbox', 'platform_events']) {
    assert.ok(deletes(table), `cleanup should delete ${table}`);
  }
});

test('provision-remaining-portal-e2e.mjs: cleanup deletes the application platform event', () => {
  const source = readScript('provision-remaining-portal-e2e.mjs');
  assert.ok(/db\.from\('platform_events'\)\s*\.delete\(\)/.test(source));
});

for (const script of scripts) {
  test(`${script}: production host is rejected without the opt-in flag`, () => {
    const result = runScript(script, {});
    assert.notEqual(result.status, 0, `${script} should fail without the flag`);
    assert.ok(
      output(result).includes(GUARD_MESSAGE),
      `${script} should fail at the guard without the flag`,
    );
  });

  test(`${script}: production host is allowed with the opt-in flag`, () => {
    const result = runScript(script, { QA_E2E_ALLOW_PRODUCTION_DISPOSABLES: '1' });
    assert.notEqual(result.status, 0, `${script} should fail with a fake key`);
    assert.ok(
      !output(result).includes(GUARD_MESSAGE),
      `${script} should pass the guard with the flag`,
    );
    // It must fail downstream (bad key / unreachable project), never silently pass.
    assert.match(output(result), /anchor|load|Invalid API key|401|fetch/i);
  });

  test(`${script}: any other host is rejected even with the opt-in flag`, () => {
    const result = runScript(script, {
      NEXT_PUBLIC_SUPABASE_URL: OTHER_URL,
      QA_E2E_ALLOW_PRODUCTION_DISPOSABLES: '1',
    });
    assert.notEqual(result.status, 0, `${script} should fail for an unknown host`);
    assert.ok(
      output(result).includes(GUARD_MESSAGE),
      `${script} should reject a non-QA, non-production host even with the flag`,
    );
  });

  test(`${script}: the isolated QA project still works without the flag`, () => {
    const result = runScript(script, { NEXT_PUBLIC_SUPABASE_URL: QA_URL });
    assert.notEqual(result.status, 0, `${script} should fail with a fake key`);
    assert.ok(
      !output(result).includes(GUARD_MESSAGE),
      `${script} should pass the guard for the QA project without the flag`,
    );
    assert.match(output(result), /anchor|load|Invalid API key|401|fetch/i);
  });
}
