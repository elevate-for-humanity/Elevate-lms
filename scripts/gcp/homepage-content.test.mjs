import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {load} from 'js-yaml';
import {normalizeHomepageText, assertHomepageHostShopContract} from './homepage-content.mjs';
test('finds the business heading across responsive spans and soft hyphens',()=>{
 const html='<h3>Business &amp; <span class="sm:hidden">Entrepre&shy;neurship</span><span class="hidden sm:inline">Entrepreneurship</span></h3>';
 assert.ok(normalizeHomepageText(html).includes('Business & Entrepreneurship'));
});
test('does not accept a missing heading from serialized script data',()=>{
 assert.equal(normalizeHomepageText('<script>Business & Entrepreneurship</script><h1>Training</h1>'),'Training');
});
test('decodes numeric ampersands and collapses content whitespace',()=>{
 assert.equal(normalizeHomepageText('<h3>Business &#38;\n Entrepreneurship</h3>'),'Business & Entrepreneurship');
});

const hostShop = `<section id="barber-beauty-network" aria-labelledby="featured-host-shop-heading"
 data-scroll-narration data-narration="Train with licensed supervision." data-narration-style="instructor">
 <h2 id="featured-host-shop-heading">Barber &amp; Beauty Apprenticeships</h2>
 <a href="/partners/host-shops">Join as a Host Shop</a>
 <a href="/barber-and-beauty-apprenticeships">Explore Barber &amp; Beauty</a>
 <div data-featured-shops><article data-featured-shop="Working salon">
 <a href="/host-shops/working-salon"><img src="/images/salon.webp" alt="Licensed mentor inside a working salon"></a>
 </article></div></section>`;

test('accepts the approved combined beauty landmark without retired promotional wording', () => {
 assert.doesNotThrow(() => assertHomepageHostShopContract(hostShop));
});
for (const [label, broken] of [
 ['missing region', `<script>${JSON.stringify(hostShop)}</script>`],
 ['broken accessible label', hostShop.replace('aria-labelledby="featured-host-shop-heading"', 'aria-labelledby="missing"')],
 ['retired heading', hostShop.replace('Barber &amp; Beauty Apprenticeships', 'Real shops. Real experience.')],
 ['missing narration', hostShop.replace('data-scroll-narration', 'data-unrelated')],
 ['missing shop photographs', hostShop.replace('data-featured-shop="Working salon"', 'data-unrelated')],
 ['unlabeled photograph', hostShop.replace('Licensed mentor inside a working salon', '')],
 ['broken join destination', hostShop.replace('/partners/host-shops', '/missing')],
 ['broken shop destination', hostShop.replace('/host-shops/working-salon', '/missing')],
]) test(`rejects ${label}`, () => assert.throws(() => assertHomepageHostShopContract(broken)));

test('exact-release acceptance runs homepage and canonical enrollment regressions on all five devices', () => {
 const {jobs} = load(readFileSync(new URL('../../.github/workflows/registered-apprenticeship-e2e.yml', import.meta.url), 'utf8'));
 const publicJob = jobs['hvac-public-playback'];
 const devices = publicJob.strategy.matrix.include.map(row => row.device);
 for (const device of ['desktop-chrome','laptop-chrome','tablet-chrome','iphone-webkit','android-chrome']) assert.ok(devices.includes(device), device);
 const step = publicJob.steps.find(row => row.name === 'Verify released homepage and canonical enrollment on every device');
 for (const file of ['home-config-leaks.spec.ts','canonical-application-flow.spec.ts']) assert.ok(step.run.includes(file), file);
 assert.ok(step.run.includes('--project=${{ matrix.device }}'));
 assert.ok(publicJob.steps.find(row => row.name === 'Capture the live Marketing release being tested').run.includes('version.commitSha, process.env.EXPECTED_MARKETING_SHA'));
});
