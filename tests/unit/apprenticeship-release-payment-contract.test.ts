import { expect, it } from 'vitest';
import { assertApprenticeshipPaymentContract } from '@/scripts/gcp/apprenticeship-payment-contract.mjs';

const valid = () => ({
  barberHtml: '<main>Have a code from admissions? Enter it at checkout.</main>',
  estheticsHtml: '<main>$6,000 tuition, $600 standard deposit, 25 hrs/week</main>',
  barberPricing: { program_slug: 'barber-apprenticeship', tuition_cents: 498000, deposit_min_cents: 60000, deposit_default_cents: 60000, payment_frequency: 'weekly', payment_weeks: 29 },
  estheticsPricing: { program_slug: 'esthetician-apprenticeship', tuition_cents: 600000, deposit_min_cents: 60000, deposit_default_cents: 60000, payment_frequency: 'monthly' },
});

it('accepts current public terms without requiring an expired code', () => {
  expect(() => assertApprenticeshipPaymentContract(valid())).not.toThrow();
});
it.each(['OCT300', 'PAYFULL600', '50OFFOCT'])('rejects public advertising of %s', code => {
  for (const page of ['barberHtml', 'estheticsHtml'] as const) {
    const data = valid(); data[page] += `<a href="/enroll?coupon=${code}">Apply</a>`;
    expect(() => assertApprenticeshipPaymentContract(data)).toThrow(/expired promotion/);
  }
});
it.each([30000, 174300, 498000])('rejects an incorrect default deposit of %i cents', amount => {
  for (const key of ['barberPricing', 'estheticsPricing'] as const) {
    const data = valid(); data[key].deposit_default_cents = amount;
    expect(() => assertApprenticeshipPaymentContract(data)).toThrow(/default deposit/);
  }
});
it('rejects a conflicting minimum even when the default is correct', () => {
  const data = valid(); data.barberPricing.deposit_min_cents = 174300;
  expect(() => assertApprenticeshipPaymentContract(data)).toThrow(/minimum deposit/);
});
it('rejects an incorrect tuition or program identity', () => {
  const data = valid(); data.barberPricing.tuition_cents = 600000;
  expect(() => assertApprenticeshipPaymentContract(data)).toThrow(/tuition/);
  data.barberPricing.tuition_cents = 498000; data.estheticsPricing.program_slug = 'barber-apprenticeship';
  expect(() => assertApprenticeshipPaymentContract(data)).toThrow(/identity/);
});
it('rejects the former monthly or incorrect barber payment term', () => {
  const data = valid(); data.barberPricing.payment_frequency = 'monthly';
  expect(() => assertApprenticeshipPaymentContract(data)).toThrow(/weekly/);
  data.barberPricing.payment_frequency = 'weekly'; data.barberPricing.payment_weeks = 3;
  expect(() => assertApprenticeshipPaymentContract(data)).toThrow(/29 weeks/);
});
