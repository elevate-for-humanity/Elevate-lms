import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const read = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8');

test('homepage features exactly the two selected real shops', () => {
  const shops = read('components/home/HomeFeaturedHostShop.tsx');
  assert.deepEqual([...shops.matchAll(/name: '([^']+)'/g)].map((m) => m[1]), ['Salon Saloon', 'Kountry Kutz Barbershop']);
  assert.equal([...shops.matchAll(/image: '/g)].length, 2);
  assert.ok(shops.includes('aspect-[16/10]'));
  assert.ok(!/brightness-|saturate-|bg-gradient-to/.test(shops));
});

test('homepage removes unrelated picture cards and long operations section', () => {
  const page = read('apps/marketing/app/page.tsx');
  assert.ok(page.includes('focused-shops-v1'));
  assert.ok(!/HomePlatformOverview|HomeFinalCTA|HomeTrustBar/.test(page));
  assert.equal((page.match(/<h1\b/g) || []).length, 1);
  assert.ok(page.includes('WORKONE_INDY_BOOKING_URL'));
  const paths = read('components/home/HomeCareerPathways.tsx');
  for (const route of ['hvac-technician', 'cdl-training', 'bookkeeping', 'business']) assert.ok(paths.includes(`/programs/${route}`));
  assert.ok(!/next\/image|<Image/.test(paths));
});

test('public mobile styles preserve media sizing and avoid dashboard leakage', () => {
  const css = read('styles/responsive-guardrails.css');
  const boundary = read('components/site/MarketingChromeBoundary.tsx');
  assert.ok(css.includes("img[data-nimg='fill'] { width: 100%; height: 100%; }"));
  assert.ok(!css.includes('width: auto;'));
  assert.ok(boundary.includes('data-marketing-main'));
  assert.ok(boundary.indexOf('if (operational || standaloneBrand)') < boundary.indexOf('data-marketing-main'));
});

test('shared mobile guides retain details, cleanup listeners and visible disclosures', () => {
  const disclosure = read('components/ui/MobileDisclosure.tsx');
  assert.ok(disclosure.includes('useState(true)'));
  assert.ok(disclosure.includes('onToggle={handleToggle}'));
  assert.ok(disclosure.includes("removeEventListener('change', syncViewport)"));
  assert.ok(disclosure.includes('<summary'));
  const program = read('components/programs/ProgramExperienceGuide.tsx');
  const apprenticeship = read('components/programs/beauty/ApprenticeshipExperienceGuide.tsx');
  assert.ok(program.includes('<MobileDisclosure'));
  assert.ok(program.includes('approval is not guaranteed'));
  assert.ok(apprenticeship.includes('<MobileDisclosure'));
  assert.equal((apprenticeship.match(/^  \['\d+'/gm) || []).length, 10);
  assert.ok(apprenticeship.includes('Wages and tuition are separate.'));
  assert.ok(apprenticeship.includes('Placement is not guaranteed.'));
});
