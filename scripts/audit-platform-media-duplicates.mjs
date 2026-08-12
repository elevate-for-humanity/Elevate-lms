#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

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
const HERO_PATH = /(?:\/heroes?\/|hero|banner)/i;
const VISUAL_CONTEXT = /(?:\bsrc\s*=|\bimage(?:Src)?\s*[:=]|\bheroImage\s*[:=]|\bposter(?:Image)?\s*[:=]|\bbackgroundImage\s*[:=]|<Image\b|<img\b|HeroPicture|HeroVideo|PictureFirstPageHero|ModernLandingHero)/i;
const HERO_CONTEXT = /(?:HeroPicture|HeroVideo|PictureFirstPageHero|ModernLandingHero|heroImage|posterImage|heroSrc|heroMedia|\bhero\b|\bbanner\b)/i;

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
      const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ');
      out.push({
        asset,
        line: i + 1,
        file: sourceLabel(file),
        hero: HERO_PATH.test(asset) || HERO_CONTEXT.test(context),
      });
    }
  }

  return out;
}

const routeRecords = [];
const routeAssetUses = new Map();
const heroRouteUses = new Map();
const withinRouteDuplicates = [];

for (const app of APPS) {
  const appRoot = path.join(ROOT, 'apps', app, 'app');
  for (const pageFile of walk(appRoot)) {
    const route = routeFor(appRoot, pageFile);
    const tree = collectTree(pageFile, appRoot);
    const occurrences = [...tree].flatMap(assetOccurrences);
    const byAsset = new Map();

    for (const occ of occurrences) {
      const key = `${app}:${route}`;
      const item = byAsset.get(occ.asset) ?? [];
      item.push(occ);
      byAsset.set(occ.asset, item);

      const routes = routeAssetUses.get(occ.asset) ?? new Set();
      routes.add(key);
      routeAssetUses.set(occ.asset, routes);

      if (occ.hero) {
        const heroRoutes = heroRouteUses.get(occ.asset) ?? new Set();
        heroRoutes.add(key);
        heroRouteUses.set(occ.asset, heroRoutes);
      }
    }

    for (const [asset, uses] of byAsset) {
      const distinctLocations = new Set(uses.map((use) => `${use.file}:${use.line}`));
      if (distinctLocations.size > 1) {
        withinRouteDuplicates.push({
          app,
          route,
          asset,
          locations: [...distinctLocations],
        });
      }
    }

    routeRecords.push({
      app,
      route,
      page: sourceLabel(pageFile),
      componentFiles: tree.size,
      imageRefs: new Set(occurrences.map((occ) => occ.asset)).size,
      heroRefs: new Set(occurrences.filter((occ) => occ.hero).map((occ) => occ.asset)).size,
    });
  }
}

const crossRouteHeroDuplicates = [...heroRouteUses.entries()]
  .filter(([, routes]) => routes.size > 1)
  .map(([asset, routes]) => ({ asset, routes: [...routes].sort() }))
  .sort((a, b) => b.routes.length - a.routes.length || a.asset.localeCompare(b.asset));

const crossRouteImageReuse = [...routeAssetUses.entries()]
  .filter(([, routes]) => routes.size > 1)
  .map(([asset, routes]) => ({ asset, routes: [...routes].sort() }))
  .sort((a, b) => b.routes.length - a.routes.length || a.asset.localeCompare(b.asset));

const heroConfigPath = path.join(ROOT, 'public/data/hero-banners.json');
let heroRegistryDuplicates = [];
if (fs.existsSync(heroConfigPath)) {
  const config = JSON.parse(fs.readFileSync(heroConfigPath, 'utf8'));
  const uses = new Map();
  for (const [key, value] of Object.entries(config)) {
    const candidates = [
      value?.posterImage,
      value?.image,
      value?.heroImage,
      value?.videoSrcDesktop,
      value?.videoSrcMobile,
    ].filter((item) => typeof item === 'string' && item.trim());
    for (const raw of candidates) {
      const asset = raw.split(/[?#]/)[0];
      if (REUSABLE_MEDIA.test(asset)) continue;
      const keys = uses.get(asset) ?? new Set();
      keys.add(key);
      uses.set(asset, keys);
    }
  }
  heroRegistryDuplicates = [...uses.entries()]
    .filter(([, keys]) => keys.size > 1)
    .map(([asset, keys]) => ({ asset, keys: [...keys].sort() }))
    .sort((a, b) => b.keys.length - a.keys.length || a.asset.localeCompare(b.asset));
}

const report = {
  generatedAt: new Date().toISOString(),
  apps: APPS,
  summary: {
    routesScanned: routeRecords.length,
    withinRouteDuplicates: withinRouteDuplicates.length,
    crossRouteHeroDuplicates: crossRouteHeroDuplicates.length,
    heroRegistryDuplicates: heroRegistryDuplicates.length,
    crossRouteImageReuseAdvisory: crossRouteImageReuse.length,
  },
  blocking: {
    withinRouteDuplicates,
    crossRouteHeroDuplicates,
    heroRegistryDuplicates,
  },
  advisory: {
    crossRouteImageReuse,
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
md += `- Duplicate non-brand media inside a route: **${report.summary.withinRouteDuplicates}**\n`;
md += `- Hero media reused across active routes: **${report.summary.crossRouteHeroDuplicates}**\n`;
md += `- Duplicate media entries in canonical hero registry: **${report.summary.heroRegistryDuplicates}**\n`;
md += `- Cross-route non-hero image reuse (advisory): **${report.summary.crossRouteImageReuseAdvisory}**\n\n`;
md += `## Blocking: duplicates inside one route\n\n`;
md += mdTable(
  ['App', 'Route', 'Asset', 'Locations'],
  withinRouteDuplicates.map((item) => [item.app, item.route, item.asset, item.locations.join('<br>')]),
);
md += `\n## Blocking: hero media reused across routes\n\n`;
md += mdTable(
  ['Asset', 'Routes'],
  crossRouteHeroDuplicates.map((item) => [item.asset, item.routes.join('<br>')]),
);
md += `\n## Blocking: duplicate canonical hero-registry media\n\n`;
md += mdTable(
  ['Asset', 'Hero keys'],
  heroRegistryDuplicates.map((item) => [item.asset, item.keys.join(', ')]),
);
md += `\n## Advisory: other image reuse across routes\n\n`;
md += mdTable(
  ['Asset', 'Routes'],
  crossRouteImageReuse.slice(0, 250).map((item) => [item.asset, item.routes.join('<br>')]),
);
md += `\n> Shared logos, icons, badges, seals, partner/sponsor assets, credentials, avatars, headshots, placeholders, QR codes, and watermarks are excluded from duplicate enforcement.\n`;

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(OUT_MD, md);

console.log('Platform media duplicate audit');
console.log(`- routes scanned: ${report.summary.routesScanned}`);
console.log(`- within-route duplicates: ${report.summary.withinRouteDuplicates}`);
console.log(`- cross-route hero duplicates: ${report.summary.crossRouteHeroDuplicates}`);
console.log(`- hero-registry duplicates: ${report.summary.heroRegistryDuplicates}`);
console.log(`- cross-route image reuse advisory: ${report.summary.crossRouteImageReuseAdvisory}`);

const blockers =
  report.summary.withinRouteDuplicates +
  report.summary.crossRouteHeroDuplicates +
  report.summary.heroRegistryDuplicates;

if (blockers > 0) {
  console.error(`FAIL: ${blockers} blocking duplicate-media findings. See ${sourceLabel(OUT_MD)}.`);
  process.exit(1);
}

console.log('PASS: no blocking duplicate non-brand imagery or hero media was found across active platform routes.');
