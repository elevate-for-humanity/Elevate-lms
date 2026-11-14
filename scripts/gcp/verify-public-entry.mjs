import assert from 'node:assert/strict';
import { APPRENTICESHIP_RELEASE_TERMS, assertApprenticeshipPricingContract, assertApprenticeshipPublicCopy } from './apprenticeship-payment-contract.mjs';

const canonical = 'https://www.elevateforhumanity.org';
const results = [];
let failed = false;
async function check(name, action) {
  try { results.push({ name, passed: true, ...await action() }); }
  catch (error) { failed = true; results.push({ name, passed: false, error: error.message }); }
}
for (const origin of ['http://www.elevateforhumanity.org', 'http://elevateforhumanity.org', 'https://elevateforhumanity.org', canonical]) {
  await check('entry:' + origin, async () => {
    const response = await fetch(origin + '/', { redirect: 'manual', signal: AbortSignal.timeout(15000), cache: 'no-store' });
    const status = response.status;
    const location = response.headers.get('location');
    await response.body?.cancel();
    if (origin === canonical) assert.equal(status, 200, 'Canonical HTTPS homepage must be available');
    else {
      assert.ok([301,302,307,308].includes(status), 'Noncanonical entry must redirect; received HTTP ' + status);
      assert.ok(location, 'Redirect must provide Location');
      assert.equal(new URL(location, origin).href, canonical + '/', 'Entry must redirect to canonical HTTPS www homepage');
    }
    return { status, location };
  });
}
await check('live-version', async () => {
  const response = await fetch(canonical + '/api/version?entryAudit=' + Date.now(), { signal: AbortSignal.timeout(15000), cache: 'no-store' });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.match(data.commitSha || '', /^[a-f0-9]{40}$/);
  return { status: response.status, commit: data.commitSha };
});
for (const slug of Object.keys(APPRENTICESHIP_RELEASE_TERMS)) {
  await check('program:' + slug, async () => {
    const response = await fetch(canonical + '/programs/' + slug + '?entryAudit=' + Date.now(), { signal: AbortSignal.timeout(20000), cache: 'no-store' });
    assert.equal(response.status, 200);
    const html = await response.text();
    // Suspense streams the fallback and its replacement; the browser removes the fallback.
    const headings=[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(match=>match[1].replace(/<[^>]*>/g,'').trim());
    assert.equal(new Set(headings).size,1,'Program must expose one distinct main heading');
    assert.ok(html.toLowerCase().includes('self-pay'), 'Program must explain self-pay tuition');
    assert.ok(!html.includes('lowers the startup deposit'), 'Retired deposit promise must remain removed');
    assert.ok(!html.includes('Estimated from $110 per week'), 'Retired weekly apprenticeship estimate must remain removed');
    assertApprenticeshipPublicCopy(slug, html);
    const pricing = await fetch(canonical + '/api/programs/pricing?slug=' + slug, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    assert.equal(pricing.status, 200);
    const data = await pricing.json();
    assertApprenticeshipPricingContract(slug, data);
    return { status: response.status, tuitionCents: data.tuition_cents, firstInvoiceCents: data.deposit_default_cents, paymentFrequency: data.payment_frequency, paymentWeeks: data.payment_weeks };
  });
}
await check('joelle-profile', async () => {
  const response = await fetch(canonical + '/host-shops/j-noelle-co', { signal: AbortSignal.timeout(20000), cache: 'no-store' });
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const value of ['J Noelle Collective', '/images/partners/j-noelle/official-salon-2026.webp', 'https://jnoellecollective.com/', 'https://www.vagaro.com/jnoelleandco']) assert.ok(html.includes(value), 'Missing approved Joelle profile field: ' + value);
  return { status: response.status };
});
for (const result of results) console.log(JSON.stringify(result));
if (failed) process.exitCode = 1;
