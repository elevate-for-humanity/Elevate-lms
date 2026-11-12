import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const checkout = readFileSync(join(process.cwd(), 'apps/marketing/app/enroll/[programId]/page.tsx'), 'utf8');
const form = readFileSync(join(process.cwd(), 'apps/marketing/app/apply/student/form/page.tsx'), 'utf8');
const terms = readFileSync(join(process.cwd(), 'lib/programs/installment-terms.ts'), 'utf8');

test('apprenticeship applicants must acknowledge terms before starting checkout', () => {
  assert.match(checkout, /const \[apprenticeshipDisclosureAccepted, setApprenticeshipDisclosureAccepted\] = useState\(false\)/);
  assert.match(checkout, /if \(\/apprentice\/i\.test\(program\?\.slug \|\| ''\) && !apprenticeshipDisclosureAccepted\)/);
  assert.ok(checkout.indexOf('!apprenticeshipDisclosureAccepted') < checkout.indexOf('setEnrolling(true)'));
  assert.match(checkout, /setApprenticeshipDisclosureAccepted\(false\)/);
  assert.match(checkout, /checked=\{apprenticeshipDisclosureAccepted\}/);
});

test('disclosure clearly separates licensing, materials and financing before payment', () => {
  for (const phrase of ['1,500 school hours', '450 school hours', 'No starter kit is supplied', 'supervised on-the-job training',
    'does not automatically grant a state license', 'not Buy Now, Pay Later', 'Affirm', 'Dashboard activation follows verified payment']) {
    assert.ok(checkout.includes(phrase), `Missing enrollment disclosure: ${phrase}`);
  }
  assert.match(checkout, /aria-labelledby="apprenticeship-disclosure-heading"/);
  assert.match(checkout, /href="https:\/\/www\.in\.gov\/pla\//);
});

test('original payment and full-application guards remain in place', () => {
  assert.match(checkout, /\/api\/programs\/enroll\/checkout/);
  assert.match(checkout, /payment_method: paymentMethod/);
  assert.match(checkout, /payment_plan: onlineSchoolProgram \|\| paymentMethod === 'affirm' \? 'full' : paymentPlan/);
  assert.match(checkout, /I have paid — verify and continue/);
  assert.match(form, /verifyPaidApplication\(initialProgram, paymentSessionId\)/);
  assert.match(form, /redirect\(initialProgram \? `\/enroll\//);
  assert.match(terms, /const term = slug === 'barber-apprenticeship' \? BARBER_PRICING\.paymentTermWeeks : 3/);
});
