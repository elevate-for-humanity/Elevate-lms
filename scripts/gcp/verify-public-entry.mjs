import assert from 'node:assert/strict';

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
const programs = [
  ['barber-apprenticeship', 498000, 124500],
  ['cosmetology-apprenticeship', 600000, 150000],
  ['esthetician-apprenticeship', 600000, 150000],
  ['nail-technician-apprenticeship', 600000, 150000],
];
for (const [slug, tuition, installment] of programs) {
  await check('program:' + slug, async () => {
    const response = await fetch(canonical + '/programs/' + slug + '?entryAudit=' + Date.now(), { signal: AbortSignal.timeout(20000), cache: 'no-store' });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, 'Program must have one main heading');
    assert.ok(html.toLowerCase().includes('self-pay'), 'Program must explain self-pay tuition');
    assert.ok(!html.includes('lowers the startup deposit'), 'Retired deposit promise must remain removed');
    assert.ok(!html.includes('Estimated from $110 per week'), 'Retired weekly apprenticeship estimate must remain removed');
    const pricing = await fetch(canonical + '/api/programs/pricing?slug=' + slug, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    assert.equal(pricing.status, 200);
    const data = await pricing.json();
    assert.equal(data.tuition_cents, tuition);
    assert.equal(data.deposit_default_cents, installment);
    assert.equal(data.payment_frequency, 'monthly');
    return { status: response.status, tuitionCents: data.tuition_cents, firstInvoiceCents: data.deposit_default_cents };
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
