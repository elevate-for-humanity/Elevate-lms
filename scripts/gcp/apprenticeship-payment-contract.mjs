import assert from 'node:assert/strict';

export const APPRENTICESHIP_RELEASE_TERMS = Object.freeze({
  'barber-apprenticeship': { tuitionCents: 498000, frequency: 'weekly', weeks: 29 },
  'cosmetology-apprenticeship': { tuitionCents: 600000, frequency: 'monthly' },
  'esthetician-apprenticeship': { tuitionCents: 600000, frequency: 'monthly' },
  'nail-technician-apprenticeship': { tuitionCents: 600000, frequency: 'monthly' },
});

export function assertApprenticeshipPricingContract(slug, pricing) {
  const terms = APPRENTICESHIP_RELEASE_TERMS[slug];
  assert.ok(terms, 'Known apprenticeship release program required');
  assert.equal(pricing?.program_slug, slug, `${slug} price identity`);
  assert.equal(pricing?.tuition_cents, terms.tuitionCents, `${slug} tuition`);
  assert.equal(pricing?.deposit_min_cents, 60000, `${slug} minimum deposit must be $600`);
  assert.equal(pricing?.deposit_default_cents, 60000, `${slug} default deposit must be $600`);
  assert.equal(pricing?.payment_frequency, terms.frequency, `${slug} balance invoices must be ${terms.frequency}`);
  if (terms.weeks) assert.equal(pricing?.payment_weeks, terms.weeks, `${slug} payment term must be ${terms.weeks} weeks`);
}

export function assertApprenticeshipPublicCopy(name, html) {
  assert.equal(typeof html, 'string', `${name} public page must be present`);
  assert.doesNotMatch(html, /\b(?:OCT300|PAYFULL600|50OFFOCT)\b/i, `${name} must not publish expired promotion codes`);
}

/** Public releases must enforce current terms without publishing expired codes. */
export function assertApprenticeshipPaymentContract({ barberHtml, estheticsHtml, barberPricing, estheticsPricing }) {
  for (const [name, html] of [['barber', barberHtml], ['esthetics', estheticsHtml]]) {
    assertApprenticeshipPublicCopy(name, html);
  }
  for (const [slug, pricing] of [
    ['barber-apprenticeship', barberPricing],
    ['esthetician-apprenticeship', estheticsPricing],
  ]) {
    assertApprenticeshipPricingContract(slug, pricing);
  }
}
