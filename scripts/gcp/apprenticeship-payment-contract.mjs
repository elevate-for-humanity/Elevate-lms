import assert from 'node:assert/strict';

/** Public releases must enforce current terms without publishing expired codes. */
export function assertApprenticeshipPaymentContract({ barberHtml, estheticsHtml, barberPricing, estheticsPricing }) {
  for (const [name, html] of [['barber', barberHtml], ['esthetics', estheticsHtml]]) {
    assert.equal(typeof html, 'string', `${name} public page must be present`);
    assert.doesNotMatch(html, /\b(?:OCT300|PAYFULL600|50OFFOCT)\b/i, `${name} must not publish expired promotion codes`);
  }
  for (const [slug, tuition, pricing] of [
    ['barber-apprenticeship', 498000, barberPricing],
    ['esthetician-apprenticeship', 600000, estheticsPricing],
  ]) {
    assert.equal(pricing?.program_slug, slug, `${slug} price identity`);
    assert.equal(pricing?.tuition_cents, tuition, `${slug} tuition`);
    assert.equal(pricing?.deposit_min_cents, 60000, `${slug} minimum deposit must be $600`);
    assert.equal(pricing?.deposit_default_cents, 60000, `${slug} default deposit must be $600`);
  }
  assert.equal(barberPricing.payment_frequency, 'weekly', 'Barber balance invoices must be weekly');
  assert.equal(barberPricing.payment_weeks, 29, 'Barber payment term must be 29 weeks');
}
