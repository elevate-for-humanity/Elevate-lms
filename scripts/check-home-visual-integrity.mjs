#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = process.cwd();
let failures = 0;

function fail(message) {
  console.error(`❌ ${message}`);
  failures += 1;
}
function pass(message) {
  console.log(`✅ ${message}`);
}
function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function auditImageQuality(relative, source) {
  const imageTags = source.match(/<Image\b[\s\S]*?\/>/g) ?? [];
  for (const tag of imageTags) {
    if (/\bfill\b/.test(tag) && !/\bsizes=/.test(tag)) {
      fail(`${relative} has a fill Image without responsive sizes.`);
    }

    const sizesMatch = tag.match(/\bsizes=(?:"([^"]+)"|'([^']+)'|\{([^}]+)\})/);
    const sizesLiteral = sizesMatch?.[1] ?? sizesMatch?.[2] ?? '';
    if (sizesLiteral && /(?:^|[,\s])(?:[1-9]|[1-8]\d|9\d|1[0-5]\d)px(?:[,\s]|$)/.test(sizesLiteral)) {
      fail(`${relative} declares an implausibly small responsive Image size: ${sizesLiteral}`);
    }

    if (/\bfill\b/.test(tag) && !/object-(?:cover|contain)/.test(tag)) {
      fail(`${relative} has a fill Image without an explicit object-fit policy.`);
    }
  }
}

const homepage = 'apps/marketing/app/page.tsx';
const home = read(homepage);
const importMatches = [...home.matchAll(/from ['"]@\/components\/home\/([^'"]+)['"]/g)];
const activeHomeComponents = importMatches.map((match) => `components/home/${match[1]}.tsx`);

if (!activeHomeComponents.length) fail('Homepage does not import canonical components/home modules.');
else pass(`Homepage uses ${activeHomeComponents.length} canonical home modules.`);

for (const component of activeHomeComponents) {
  if (!existsSync(join(root, component))) {
    fail(`Active homepage component is missing: ${component}`);
    continue;
  }

  const staleTwin = `app/components/home/${basename(component)}`;
  if (existsSync(join(root, staleTwin))) {
    fail(`Duplicate homepage implementation exists: ${component} and ${staleTwin}`);
  }

  const source = read(component);
  if (/https?:\/\/(?:images\.)?(?:unsplash\.com|pexels\.com|pixabay\.com)/i.test(source)) {
    fail(`${component} embeds remote stock photography instead of a governed local asset.`);
  }
  auditImageQuality(component, source);
}

const reusableVisuals = [
  'components/ui/ProgramCard.tsx',
  'components/ui/FeatureCard.tsx',
  'components/marketing/PhotoCTA.tsx',
  'components/hero/HeroMediaFrame.tsx',
];
for (const relative of reusableVisuals) {
  if (!existsSync(join(root, relative))) {
    fail(`Reusable visual primitive is missing: ${relative}`);
    continue;
  }
  const source = read(relative);
  auditImageQuality(relative, source);
  if ((relative.includes('ProgramCard') || relative.includes('FeatureCard')) && !source.includes('@/lib/page-design-tokens')) {
    fail(`${relative} bypasses the locked page design tokens.`);
  }
  if (/group-hover:scale/.test(source) && !/motion-reduce:|motion-safe:/.test(source)) {
    fail(`${relative} adds image motion without reduced-motion handling.`);
  }
}

const heroWrapper = read('components/ui/HomeHeroVideo.tsx');
if (!heroWrapper.includes('NEXT_PUBLIC_GIT_SHA')) fail('Homepage hero media is not revisioned by deployed commit SHA.');
else pass('Homepage hero media is revisioned by deployed commit SHA.');
if (!heroWrapper.includes('overlayMode="none"')) {
  fail('Homepage hero reintroduced an image-darkening gradient overlay.');
} else {
  pass('Homepage hero preserves unfiltered video presentation.');
}
if (heroWrapper.includes("trustIndicators={banner.trustIndicators}")) {
  fail('Homepage hero renders raw trust labels without public normalization.');
} else {
  pass('Homepage trust labels pass through the public normalization layer.');
}

const trustBar = read('components/home/HomeTrustBar.tsx');
if (/Accreditations\s*&(?:amp;)?\s*Approvals/i.test(trustBar)) {
  fail('Trust bar still describes mixed registrations/relationships as accreditations.');
} else {
  pass('Trust bar distinguishes registrations, approvals, and funding pathways.');
}

const forbiddenStale = ['app/components/home/HomeCareerPathways.tsx'];
for (const path of forbiddenStale) {
  if (existsSync(join(root, path))) fail(`Obsolete visual implementation still exists: ${path}`);
}

if (failures) {
  console.error(`\n❌ Homepage visual integrity gate failed with ${failures} issue(s).`);
  process.exit(1);
}
console.log('\n✅ Homepage visual integrity gate passed.');
