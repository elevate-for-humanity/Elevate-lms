#!/usr/bin/env node
/**
 * Media / visual integrity gate.
 *
 * Validates local media references, canonical program imagery, key portal
 * picture coverage, and the production rule that browser SpeechSynthesis may
 * not be used for spoken output.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const publicDir = path.join(rootDir, 'public');
let failures = 0;

function pass(message) { console.log(`✅ ${message}`); }
function fail(message) { console.error(`❌ ${message}`); failures += 1; }

function scanSourceFiles(relativeRoots, visitor) {
  const seen = new Set();
  function scanDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === 'docs' || entry.name === 'reports') continue;
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) {
        const relative = path.relative(rootDir, fullPath);
        if (seen.has(relative)) continue;
        seen.add(relative);
        visitor(fullPath, relative, fs.readFileSync(fullPath, 'utf8'));
      }
    }
  }
  for (const rel of relativeRoots) scanDir(path.join(rootDir, rel));
}

console.log('\n── Local media references ──');
const mediaReferences = new Map();
scanSourceFiles(['app', 'apps', 'components', 'data', 'lib'], (_file, relative, content) => {
  const patterns = [
    /(?:src|poster|imageSrc|image|heroImage|cardImage|thumbnailUrl|videoUrl)\s*[=:]\s*["'`](\/(?:images|videos)\/[^"'`$}]+)["'`]/g,
    /["'`](\/(?:images|videos)\/[^"'`$}]+\.(?:png|jpe?g|webp|gif|svg|mp4|webm|mov))["'`]/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const url = match[1];
      if (!mediaReferences.has(url)) mediaReferences.set(url, new Set());
      mediaReferences.get(url).add(relative);
    }
  }
});

const missingLocalMedia = [];
for (const [url, owners] of mediaReferences) {
  if (url.startsWith('/videos/')) continue; // video production media is mirrored/R2-backed.
  const localPath = path.join(publicDir, url.replace(/^\//, ''));
  if (!fs.existsSync(localPath)) missingLocalMedia.push({ url, owners: [...owners] });
}
if (missingLocalMedia.length) {
  for (const item of missingLocalMedia) fail(`Missing image ${item.url} referenced by ${item.owners.slice(0, 3).join(', ')}`);
} else {
  pass(`${[...mediaReferences.keys()].filter((url) => url.startsWith('/images/')).length} local image references resolve in public/`);
}

console.log('\n── Static program image coverage ──');
const indexSource = fs.readFileSync(path.join(rootDir, 'data/programs/index.ts'), 'utf8');
const importedProgramFiles = [...indexSource.matchAll(/from ['"]\.\/([^'"]+)['"]/g)].map((match) => match[1]);
const staticSlugs = [];
for (const file of importedProgramFiles) {
  const programPath = path.join(rootDir, 'data/programs', `${file}.ts`);
  if (!fs.existsSync(programPath)) continue;
  const source = fs.readFileSync(programPath, 'utf8');
  const slug = source.match(/\bslug:\s*['"]([^'"]+)['"]/)?.[1];
  if (slug) staticSlugs.push(slug);
}

const imageRegistrySource = fs.readFileSync(path.join(rootDir, 'lib/images/programImages.ts'), 'utf8');
const registryBody = imageRegistrySource.split('export const PROGRAM_IMAGES')[1]?.split('export function getProgramCardImage')[0] || '';
const registrySlugs = new Set(
  [...registryBody.matchAll(/^\s*(?:'([^']+)'|([A-Za-z0-9_-]+)):\s*\{/gm)]
    .map((match) => match[1] || match[2])
    .filter(Boolean),
);
const unmappedPrograms = [...new Set(staticSlugs)].filter((slug) => !registrySlugs.has(slug));
if (unmappedPrograms.length) fail(`Static programs missing PROGRAM_IMAGES entries: ${unmappedPrograms.join(', ')}`);
else pass(`${new Set(staticSlugs).size} static program slugs have canonical card/hero imagery`);

const imageAssignments = [];
for (const match of registryBody.matchAll(/\b(card|hero):\s*(?:`([^`]+)`|'([^']+)'|"([^"]+)")/g)) {
  const role = match[1];
  const raw = match[2] || match[3] || match[4] || '';
  const resolved = raw.replace(/\$\{P\}/g, '/images/pages');
  if (resolved.startsWith('/images/')) imageAssignments.push({ role, path: resolved });
}
const assignmentOwners = new Map();
for (const assignment of imageAssignments) {
  const current = assignmentOwners.get(assignment.path) || [];
  current.push(assignment.role);
  assignmentOwners.set(assignment.path, current);
}
const duplicateProgramImages = [...assignmentOwners.entries()].filter(([, roles]) => roles.length > 1);
if (duplicateProgramImages.length) {
  fail(`Duplicate image assignments inside PROGRAM_IMAGES: ${duplicateProgramImages.map(([src]) => src).join(', ')}`);
} else {
  pass('PROGRAM_IMAGES does not reuse a card/hero asset across unrelated entries');
}

console.log('\n── Portal picture coverage ──');
const portalRequirements = [
  ['Learner', 'apps/lms/app/lms/(app)/dashboard/page.tsx', ['<Image', 'getProgramCardImage', 'learningTools']],
  ['Apprentice', 'apps/lms/app/apprentice/page.tsx', ['<Image', 'getProgramHeroImage', 'Your workspaces']],
  ['Host Shop', 'apps/lms/app/host-shop/dashboard/board/page.tsx', ['<Image', 'PortalImageCard', 'Host Shop tools']],
  ['Program Holder', 'apps/marketing/app/program-holder/dashboard/page.tsx', ['<Image', 'getProgramCardImage', 'Your programs']],
];
for (const [name, relPath, markers] of portalRequirements) {
  const source = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
  const missing = markers.filter((marker) => !source.includes(marker));
  if (missing.length) fail(`${name} dashboard missing picture contract markers: ${missing.join(', ')}`);
  else pass(`${name} dashboard has picture-backed hero/program/workspace treatment`);
}

console.log('\n── Natural voice policy ──');
const roboticSpeechUses = [];
scanSourceFiles(['apps', 'components', 'lib'], (_file, relative, content) => {
  if (
    /new\s+SpeechSynthesisUtterance\s*\(/.test(content) ||
    /(?:window\.)?speechSynthesis\.speak\s*\(/.test(content)
  ) {
    roboticSpeechUses.push(relative);
  }
});
if (roboticSpeechUses.length) {
  fail(`Browser SpeechSynthesis output remains in production source: ${roboticSpeechUses.join(', ')}`);
} else {
  pass('No production source uses browser SpeechSynthesis for spoken output');
}

const naturalRoute = fs.readFileSync(path.join(rootDir, 'lib/ai/natural-voice-route.ts'), 'utf8');
if (!naturalRoute.includes("model: 'gpt-4o-mini-tts'")) fail('Natural voice handler is not using the configured natural TTS model');
else pass('Shared natural AI voice handler is configured');

console.log('\n────────────────────────────');
if (failures) {
  console.error(`\n❌ Media integrity FAILED — ${failures} issue(s).\n`);
  process.exit(1);
}
console.log('\n✅ Media / visual integrity PASSED.\n');
