import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBeautyPaymentGate, isBeautyApprenticeshipSlug } from '../../lib/apprenticeship/beauty-payment-gate.mjs';

const beauty = ['barber-apprenticeship','cosmetology-apprenticeship','esthetician-apprenticeship','nail-technician-apprenticeship'];
for (const program_slug of beauty) {
  test(`unpaid ${program_slug} applicant cannot enter LMS workspace`, () => {
    assert.deepEqual(evaluateBeautyPaymentGate([{ program_slug, funding_type: 'self_pay', payment_status: null }], []),
      { locked: true, programSlug: program_slug });
  });
  test(`self-declared WIOA without verified authorization is blocked: ${program_slug}`, () => {
    assert.ok(evaluateBeautyPaymentGate([{ program_slug, funding_type: 'wioa', funding_verified: false }], []));
  });
  test(`verified WIOA approval may proceed to authorized enrollment: ${program_slug}`, () => {
    assert.equal(evaluateBeautyPaymentGate([{ program_slug, funding_type: 'wioa', funding_verified: true }], []), null);
  });
  test(`existing active enrollment and historic payment plan are preserved: ${program_slug}`, () => {
    assert.equal(evaluateBeautyPaymentGate([{ program_slug, funding_type: 'self_pay' }],
      [{ program_slug, status: 'active', enrollment_state: 'active', payment_status: null }]), null);
  });
}
test('paid status without a real active enrollment does not grant course access', () => {
  assert.ok(evaluateBeautyPaymentGate([{ program_slug: beauty[0], payment_status: 'paid' }], []));
});
test('unrelated active enrolled courses are never greyed out by a new beauty inquiry', () => {
  assert.equal(evaluateBeautyPaymentGate([{ program_slug: beauty[0] }],
    [{ program_slug: 'hvac-technician', status: 'active', enrollment_state: 'active' }]), null);
});
test('other course routes are not intercepted by a beauty application', () => {
  assert.equal(evaluateBeautyPaymentGate([{ program_slug: beauty[0] }], [], 'bookkeeping'), null);
});
test('a beauty course route remains locked despite access to unrelated coursework', () => {
  assert.ok(evaluateBeautyPaymentGate([{ program_slug: beauty[0] }],
    [{ program_slug: 'hvac-technician', status: 'active', enrollment_state: 'active' }], beauty[0]));
});
test('do not accept a revoked enrollment as proof of authorization', () => {
  assert.ok(evaluateBeautyPaymentGate([{ program_slug: beauty[0] }],
    [{ program_slug: beauty[0], status: 'active', enrollment_state: 'active', revoked_at: '2026-11-01' }]));
});
test('nail technician application also gates legacy nail-tech course alias', () => {
  assert.equal(isBeautyApprenticeshipSlug('nail-tech-apprenticeship'), true);
  assert.ok(evaluateBeautyPaymentGate([{ program_slug: 'nail-technician-apprenticeship' }], [], 'nail-tech-apprenticeship'));
});
