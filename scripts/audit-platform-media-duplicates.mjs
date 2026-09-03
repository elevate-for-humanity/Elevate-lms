#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const APPS = ['marketing', 'lms', 'admin'];
const COMPONENT_ROOT = path.join(ROOT, 'components');
const OUT_JSON = path.join(ROOT, 'docs/audits/PLATFORM_MEDIA_DUPLICATES.json');
const OUT_MD = path.join(ROOT, 'docs/audits/PLATFORM_MEDIA_DUPLICATES.md');

const SOURCE_EXTS = ['.tsx', '.ts', '.jsx', '.js'];
const PAGE_NAMES = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js']);
const IMPORT_RE = /from\s+['"]([^'"]+)['"]/g;
const ASSET_RE = /['"](\/(?:images|uploads|media)\/[^'"\s)]+)['"]/g;
const REUSABLE_MEDIA = /(?:logo|favicon|icon|badge|seal|partner|sponsor|credential|certification|qr|avatar|headshot|placeholder|watermark)/i;
const VISUAL_CONTEXT = /(?:\bsrc\s*=|\bimage(?:Src)?\s*[:=]|\bheroImage\s*[:=]|\bposter(?:Image)?\s*[:=]|\bbackgroundImage\s*[:=]|<Image\b|<img\b|HeroPicture|HeroVideo|PictureFirstPageHero|ModernLandingHero)/i;
const HERO_CONTEXT = /(?:HeroPicture|HeroVideo|PictureFirstPageHero|ModernLandingHero|\bheroImage\b|\bposterImage\b|\bheroSrc\b|\bheroMedia\b|\/\*\s*(?:VIDEO\s+)?Hero(?:\s+Section)?[^*]*\*\/|\bHero Section\b|\bpriority\b)/i;
const fingerprintCache = new Map();

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'archive', 'deprecated', '__snapshots__'].includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (PAGE_NAMES.has(ent.name)) out.push(full);
  }
  return out;
}

function resolveSource(base) {
  const candidates = path.extname(base)
    ? [base]
    : [
        ...SOURCE_EXTS.map((ext) => `${base}${ext}`),
        ...SOURCE_EXTS.map((ext) => path.join(base, `index${ext}`)),
      ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function resolveModule(fromFile, specifier, appRoot) {
  let base;
  if (specifier.startsWith('@/components/')) {
    base = path.join(ROOT, specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    base = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null;
  }

  const resolved = resolveSource(base);
  if (!resolved) return null;
  const normalized = path.resolve(resolved);
  const inComponents = normalized.startsWith(`${COMPONENT_ROOT}${path.sep}`);
  const inApp = normalized.startsWith(`${appRoot}${path.sep}`);
  return inComponents || inApp ? normalized : null;
}

function collectTree(pageFile, appRoot) {
  const visited = new Set();
  const stack = [pageFile];
  while (stack.length) {
    const file = stack.pop();
    if (!file || visited.has(file)) continue;
    visited.add(file);
    const source = fs.readFileSync(file, 'utf8');
    IMPORT_RE.lastIndex = 0;
    for (const match of source.matchAll(IMPORT_RE)) {
      const resolved = resolveModule(file, match[1], appRoot);
      if (resolved && !visited.has(resolved)) stack.push(resolved);
    }
  }
  return visited;
}

function routeFor(appRoot, pageFile) {
  const relDir = path.relative(appRoot, path.dirname(pageFile)).replaceAll('\\', '/');
  const segments = relDir
    .split('/')
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
  return '/' + segments.join('/');
}

function sourceLabel(file) {
  return path.relative(ROOT, file).replaceAll('\\', '/');
}

function localAssetFile(app, asset) {
  const relative = asset.replace(/^\/+/, '');
  // App-specific public files override the repository-level public tree in the
  // deployed service, so fingerprint the same effective asset the app serves.
  const candidates = [
    path.join(ROOT, 'apps', app, 'public', relative),
    path.join(ROOT, 'public', relative),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function assetFingerprint(app, asset) {
  const cacheKey = `${app}:${asset}`;
  if (fingerprintCache.has(cacheKey)) return fingerprintCache.get(cacheKey);
  const file = localAssetFile(app, asset);
  if (!file) {
    const fallback = `path:${asset}`;
    fingerprintCache.set(cacheKey, fallback);
    return fallback;
  }
  const hash = createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const fingerprint = `sha256:${hash}`;
  fingerprintCache.set(cacheKey, fingerprint);
  return fingerprint;
}

function assetOccurrences(file) {
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split('\n');
  const out = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!VISUAL_CONTEXT.test(line)) continue;
    ASSET_RE.lastIndex = 0;
    for (const match of line.matchAll(ASSET_RE)) {
      const asset = match[1].split(/[?#]/)[0];
      if (REUSABLE_MEDIA.test(asset)) continue;
      const context = lines.slice(Math.max(0, i - 4), Math.min(lines.length, i + 5)).join(' ');
      const structuralContext = context.replaceAll(asset, '');
      out.push({
        asset,
        line: i + 1,
        absFile: file,
        file: sourceLabel(file),
        hero: HERO_CONTEXT.test(structuralContext),
      });
    }
  }

  return out;
}

function addFingerprintUse(map, fingerprint, routeKey, asset) {
  const entry = map.get(fingerprint) ?? { routes: new Set(), assets: new Set() };
  entry.routes.add(routeKey);
  entry.assets.add(asset);
  map.set(fingerprint, entry);
}

function describeFingerprintGroup(fingerprint, uses) {
  const assets = [...new Set(uses.map((use) => use.asset))].sort();
  return {
    fingerprint,
    asset: assets[0] ?? null,
    aliases: assets,
    locations: [...new Set(uses.map((use) => `${use.file}:${use.line}`))],
    ownedLocations: [...new Set(
      uses.filter((use) => use.ownedByRoute).map((use) => `${use.file}:${use.line}`),
    )],
  };
}

const routeRecords = [];
const routeAssetUses = new Map();
const routeFingerprintUses = new Map();
const ownedHeroFingerprintUses = new Map();
const withinRouteDuplicates = [];
const sharedComponentDuplicateAdvisory = [];

for (const app of APPS) {
  const appRoot = path.join(ROOT, 'apps', app, 'app');
  for (const pageFile of walk(appRoot)) {
    const route = routeFor(appRoot, pageFile);
    const routeDir = path.dirname(pageFile);
    const tree = collectTree(pageFile, appRoot);
    const occurrences = [...tree].flatMap(assetOccurrences).map((occ) => ({
      ...occ,
      fingerprint: assetFingerprint(app, occ.asset),
      ownedByRoute: occ.absFile === pageFile || occ.absFile.startsWith(`${routeDir}${path.sep}`),
    }));
    const byFingerprint = new Map();

    for (const occ of occurrences) {
      const key = `${app}:${route}`;
      const item = byFingerprint.get(occ.fingerprint) ?? [];
      item.push(occ);
      byFingerprint.set(occ.fingerprint, item);

      const routes = routeAssetUses.get(occ.asset) ?? new Set();
      routes.add(key);
      routeAssetUses.set(occ.asset, routes);
      addFingerprintUse(routeFingerprintUses, occ.fingerprint, key, occ.asset);

      if (occ.hero && occ.ownedByRoute) {
        addFingerprintUse(ownedHeroFingerprintUses, occ.fingerprint, key, occ.asset);
      }
    }

    for (const [fingerprint, uses] of byFingerprint) {
      const group = describeFingerprintGroup(fingerprint, uses);
      if (group.locations.length <= 1) continue;

      const finding = { app, route, ...group };
      if (group.ownedLocations.length > 1) withinRouteDuplicates.push(finding);
      else sharedComponentDuplicateAdvisory.push(finding);
    }

    routeRecords.push({
      app,
      route,
      page: sourceLabel(pageFile),
      componentFiles: tree.size,
      imageRefs: new Set(occurrences.map((occ) => occ.asset)).size,
      imageFingerprints: new Set(occurrences.map((occ) => occ.fingerprint)).size,
      ownedImageRefs: new Set(occurrences.filter((occ) => occ.ownedByRoute).map((occ) => occ.asset)).size,
      ownedImageFingerprints: new Set(
        occurrences.filter((occ) => occ.ownedByRoute).map((occ) => occ.fingerprint),
      ).size,
      ownedHeroRefs: new Set(
        occurrences.filter((occ) => occ.ownedByRoute && occ.hero).map((occ) => occ.asset),
      ).size,
      ownedHeroFingerprints: new Set(
        occurrences.filter((occ) => occ.ownedByRoute && occ.hero).map((occ) => occ.fingerprint),
      ).size,
    });
  }
}

const crossRouteHeroDuplicates = [...ownedHeroFingerprintUses.entries()]
  .filter(([, entry]) => entry.routes.size > 1)
  .map(([fingerprint, entry]) => ({
    fingerprint,
    asset: [...entry.assets].sort()[0] ?? null,
    aliases: [...entry.assets].sort(),
    routes: [...entry.routes].sort(),
  }))
  .sort((a, b) => b.routes.length - a.routes.length || String(a.asset).localeCompare(String(b.asset)));

const crossRouteImageReuse = [...routeFingerprintUses.entries()]
  .filter(([, entry]) => entry.routes.size > 1)
  .map(([fingerprint, entry]) => ({
    fingerprint,
    asset: [...entry.assets].sort()[0] ?? null,
    aliases: [...entry.assets].sort(),
    routes: [...entry.routes].sort(),
  }))
  .sort((a, b) => b.routes.length - a.routes.length || String(a.asset).localeCompare(String(b.asset)));

const heroConfigPath = path.join(ROOT, 'public/data/hero-banners.json');
let heroRegistryDuplicates = [];
if (fs.existsSync(heroConfigPath)) {
  const config = JSON.parse(fs.readFileSync(heroConfigPath, 'utf8'));
  const uses = new Map();
  for (const [key, value] of Object.entries(config)) {
    const candidates = [value?.posterImage, value?.image, value?.heroImage]
      .filter((item) => typeof item === 'string' && item.trim());
    for (const raw of candidates) {
      const asset = raw.split(/[?#]/)[0];
      if (REUSABLE_MEDIA.test(asset)) continue;
      const fingerprint = assetFingerprint('marketing', asset);
      const entry = uses.get(fingerprint) ?? { keys: new Set(), assets: new Set() };
      entry.keys.add(key);
      entry.assets.add(asset);
      uses.set(fingerprint, entry);
    }
  }
  heroRegistryDuplicates = [...uses.entries()]
    .filter(([, entry]) => entry.keys.size > 1)
    .map(([fingerprint, entry]) => ({
      fingerprint,
      asset: [...entry.assets].sort()[0] ?? null,
      aliases: [...entry.assets].sort(),
      keys: [...entry.keys].sort(),
    }))
    .sort((a, b) => b.keys.length - a.keys.length || String(a.asset).localeCompare(String(b.asset)));
}

const binaryAliasGroups = [...routeFingerprintUses.entries()]
  .filter(([fingerprint, entry]) => fingerprint.startsWith('sha256:') && entry.assets.size > 1)
  .map(([fingerprint, entry]) => ({
    fingerprint,
    aliases: [...entry.assets].sort(),
    routes: [...entry.routes].sort(),
  }))
  .sort((a, b) => b.aliases.length - a.aliases.length || a.aliases[0].localeCompare(b.aliases[0]));

const report = {
  generatedAt: new Date().toISOString(),
  apps: APPS,
  summary: {
    routesScanned: routeRecords.length,
    withinRouteDuplicates: withinRouteDuplicates.length,
    crossRouteHeroDuplicates: crossRouteHeroDuplicates.length,
    heroRegistryDuplicates: heroRegistryDuplicates.length,
    sharedComponentDuplicateAdvisory: sharedComponentDuplicateAdvisory.length,
    crossRouteImageReuseAdvisory: crossRouteImageReuse.length,
    binaryAliasGroups: binaryAliasGroups.length,
  },
  blocking: {
    withinRouteDuplicates,
    crossRouteHeroDuplicates,
    heroRegistryDuplicates,
  },
  advisory: {
    sharedComponentDuplicateAdvisory,
    crossRouteImageReuse,
    binaryAliasGroups,
  },
  routes: routeRecords,
};

function mdTable(headers, rows) {
  if (!rows.length) return 'None.\n';
  const esc = (value) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
  return `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows
    .map((row) => `| ${row.map(esc).join(' | ')} |`)
    .join('\n')}\n`;
}

let md = `# Platform media duplicate audit\n\nGenerated: ${report.generatedAt}\n\n`;
md += `## Summary\n\n`;
md += `- Routes scanned: **${report.summary.routesScanned}**\n`;
md += `- Duplicate non-brand pictures inside a route-owned page/component: **${report.summary.withinRouteDuplicates}**\n`;
md += `- Route-owned hero pictures reused across active routes: **${report.summary.crossRouteHeroDuplicates}**\n`;
md += `- Duplicate poster/image content in canonical hero registry: **${report.summary.heroRegistryDuplicates}**\n`;
md += `- Shared-component duplicate candidates (advisory): **${report.summary.sharedComponentDuplicateAdvisory}**\n`;
md += `- Other cross-route picture reuse (advisory): **${report.summary.crossRouteImageReuseAdvisory}**\n`;
md += `- Different filenames containing identical image bytes: **${report.summary.binaryAliasGroups}**\n\n`;
md += `## Blocking: duplicate pictures inside one route\n\n`;
md += mdTable(
  ['App', 'Route', 'Representative asset', 'Binary aliases', 'Route-owned locations'],
  withinRouteDuplicates.map((item) => [
    item.app,
    item.route,
    item.asset,
    item.aliases.join('<br>'),
    item.ownedLocations.join('<br>'),
  ]),
);
md += `\n## Blocking: route-owned hero pictures reused across routes\n\n`;
md += mdTable(
  ['Representative asset', 'Binary aliases', 'Routes'],
  crossRouteHeroDuplicates.map((item) => [item.asset, item.aliases.join('<br>'), item.routes.join('<br>')]),
);
md += `\n## Blocking: duplicate canonical hero-registry poster/images\n\n`;
md += mdTable(
  ['Representative asset', 'Binary aliases', 'Hero keys'],
  heroRegistryDuplicates.map((item) => [item.asset, item.aliases.join('<br>'), item.keys.join(', ')]),
);
md += `\n## Advisory: duplicate pictures inside shared component trees\n\n`;
md += mdTable(
  ['App', 'Route', 'Representative asset', 'Binary aliases', 'Locations'],
  sharedComponentDuplicateAdvisory.slice(0, 250).map((item) => [
    item.app,
    item.route,
    item.asset,
    item.aliases.join('<br>'),
    item.locations.join('<br>'),
  ]),
);
md += `\n## Advisory: other picture reuse across routes\n\n`;
md += mdTable(
  ['Representative asset', 'Binary aliases', 'Routes'],
  crossRouteImageReuse.slice(0, 250).map((item) => [item.asset, item.aliases.join('<br>'), item.routes.join('<br>')]),
);
md += `\n## Advisory: binary-identical aliases\n\n`;
md += mdTable(
  ['Fingerprint', 'Aliases', 'Routes'],
  binaryAliasGroups.slice(0, 250).map((item) => [
    item.fingerprint.replace('sha256:', '').slice(0, 16),
    item.aliases.join('<br>'),
    item.routes.join('<br>'),
  ]),
);
md += `\n> Duplicate enforcement uses the actual deployed image bytes when a local asset exists. Renaming or copying the same picture cannot make it pass as unique. Shared logos, icons, badges, seals, partner/sponsor assets, credentials, avatars, headshots, placeholders, QR codes, and watermarks are excluded. Shared category videos are reported by the existing hero audit but are not treated as duplicate-image failures here. Hero classification is based on render structure, never filenames.\n`;

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(OUT_MD, md);

console.log('Platform media duplicate audit');
console.log(`- routes scanned: ${report.summary.routesScanned}`);
console.log(`- route-owned within-route duplicate pictures: ${report.summary.withinRouteDuplicates}`);
console.log(`- route-owned cross-route hero duplicate pictures: ${report.summary.crossRouteHeroDuplicates}`);
console.log(`- hero-registry duplicate picture content: ${report.summary.heroRegistryDuplicates}`);
console.log(`- shared-component duplicate advisory: ${report.summary.sharedComponentDuplicateAdvisory}`);
console.log(`- cross-route picture reuse advisory: ${report.summary.crossRouteImageReuseAdvisory}`);
console.log(`- binary-identical alias groups: ${report.summary.binaryAliasGroups}`);

const blockers =
  report.summary.withinRouteDuplicates +
  report.summary.crossRouteHeroDuplicates +
  report.summary.heroRegistryDuplicates;

if (blockers > 0) {
  console.error(`FAIL: ${blockers} blocking duplicate-picture findings. See ${sourceLabel(OUT_MD)}.`);
  process.exit(1);
}

console.log('PASS: no blocking duplicate non-brand pictures or route-owned hero pictures were found across active platform routes.');
