#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const AUDIT_SCRIPT = path.join(ROOT, 'scripts/audit-platform-media-duplicates.mjs');
const REPORT_PATH = path.join(ROOT, 'docs/audits/PLATFORM_MEDIA_DUPLICATES.json');
const IMAGE_ROOT = path.join(ROOT, 'public/images');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const REUSABLE_MEDIA = /(?:logo|favicon|icon|badge|seal|partner|sponsor|credential|certification|qr|avatar|headshot|placeholder|watermark)/i;
const ASSET_LITERAL_RE = /['"](\/(?:images|uploads|media)\/[^'"\s)]+)['"]/g;
const HERO_CONTEXT = /(?:HeroPicture|HeroVideo|PictureFirstPageHero|ModernLandingHero|\bheroImage\b|\bposterImage\b|\bheroSrc\b|\bheroMedia\b|\/\*\s*(?:VIDEO\s+)?Hero(?:\s+Section)?[^*]*\*\/|\bHero Section\b|\bpriority\b)/i;
const STOP = new Set([
  'app','apps','page','pages','image','images','hero','heroes','banner','marketing','admin','lms','store',
  'program','programs','dashboard','portal','the','and','for','with','from','your','our','this','that','into',
  'new','slug','course','module','assessment','apply','verify','www','webp','jpg','jpeg','png','avif',
]);
const hashCache = new Map();

function walkFiles(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'archive', 'deprecated', '__snapshots__'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

function webPath(file) {
  return '/' + path.relative(path.join(ROOT, 'public'), file).replaceAll('\\', '/');
}

function tokenize(value) {
  return new Set(
    String(value || '')
      .toLowerCase()
      .replace(/\[[^\]]+\]/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 3 && !STOP.has(token)),
  );
}

function overlap(a, b) {
  let count = 0;
  for (const token of a) if (b.has(token)) count += 1;
  return count;
}

function effectiveAssetFile(app, asset) {
  const relative = asset.replace(/^\/+/, '');
  const candidates = [
    path.join(ROOT, 'apps', app, 'public', relative),
    path.join(ROOT, 'public', relative),
  ];
  return candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile()) ?? null;
}

function fingerprintFile(file) {
  if (!file) return null;
  if (hashCache.has(file)) return hashCache.get(file);
  const fp = createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  hashCache.set(file, fp);
  return fp;
}

function fingerprintAsset(app, asset) {
  return fingerprintFile(effectiveAssetFile(app, asset));
}

const mediaFiles = walkFiles(
  IMAGE_ROOT,
  (file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()) && !REUSABLE_MEDIA.test(webPath(file)),
);

const MEDIA = mediaFiles.map((file) => {
  const asset = webPath(file);
  return {
    asset,
    file,
    rootFingerprint: fingerprintFile(file),
    tokens: tokenize(asset),
    heroish: /(?:hero|banner|page-1|overview|landing|header)/i.test(path.basename(asset)),
  };
});

if (!MEDIA.length) throw new Error('No candidate media files found under public/images');

function sourceAssetPaths(source) {
  ASSET_LITERAL_RE.lastIndex = 0;
  return [...source.matchAll(ASSET_LITERAL_RE)].map((match) => match[1].split(/[?#]/)[0]);
}

function buildGloballyUsedFingerprints() {
  const used = new Set();
  for (const app of ['marketing', 'lms', 'admin']) {
    const files = walkFiles(path.join(ROOT, 'apps', app, 'app'), (file) => /\.(?:tsx|ts|jsx|js)$/.test(file));
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      for (const asset of sourceAssetPaths(source)) {
        const fp = fingerprintAsset(app, asset);
        if (fp) used.add(fp);
      }
    }
  }
  for (const file of walkFiles(path.join(ROOT, 'components'), (candidate) => /\.(?:tsx|ts|jsx|js)$/.test(candidate))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const asset of sourceAssetPaths(source)) {
      const rootFile = path.join(ROOT, 'public', asset.replace(/^\/+/, ''));
      const fp = fs.existsSync(rootFile) ? fingerprintFile(rootFile) : null;
      if (fp) used.add(fp);
    }
  }
  return used;
}

const globallyUsedFingerprints = buildGloballyUsedFingerprints();
const newlyReservedFingerprints = new Set();

function runAudit() {
  try {
    execFileSync(process.execPath, [AUDIT_SCRIPT], { cwd: ROOT, stdio: 'inherit' });
  } catch {
    // Expected while blockers remain.
  }
  return JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
}

function parseLocation(location) {
  const match = String(location).match(/^(.*):(\d+)$/);
  if (!match) return null;
  return { file: path.join(ROOT, match[1]), line: Number(match[2]) };
}

function contextAt(lines, lineNumber, radius = 6) {
  const index = Math.max(0, lineNumber - 1);
  return lines.slice(Math.max(0, index - radius), Math.min(lines.length, index + radius + 1)).join(' ');
}

function actualAliasOnLine(line, aliases) {
  return (aliases ?? []).find((asset) => line.includes(asset)) ?? null;
}

function usedFingerprintsInSource(app, source) {
  const used = new Set();
  for (const asset of sourceAssetPaths(source)) {
    const fp = fingerprintAsset(app, asset);
    if (fp) used.add(fp);
  }
  return used;
}

function candidateFingerprint(app, candidate) {
  return fingerprintAsset(app, candidate.asset) ?? candidate.rootFingerprint;
}

function scoreCandidate(candidate, { route, context, aliases, preferHero }) {
  const routeTokens = tokenize(route);
  const contextTokens = tokenize(context);
  const aliasTokens = tokenize((aliases ?? []).join(' '));
  const routeMatches = overlap(candidate.tokens, routeTokens);
  const contextMatches = overlap(candidate.tokens, contextTokens);
  const aliasMatches = overlap(candidate.tokens, aliasTokens);
  let score = routeMatches * 12 + contextMatches * 3 + aliasMatches * 2;
  if (preferHero && candidate.heroish) score += 2;
  if (/\/pages\//.test(candidate.asset)) score += 1;
  return { score, routeMatches, contextMatches };
}

function pickCandidate({ app, route, context, aliases, usedFingerprints, blockedFingerprint, preferHero = false }) {
  const ranked = MEDIA.flatMap((candidate) => {
    const fingerprint = candidateFingerprint(app, candidate);
    if (!fingerprint || fingerprint === blockedFingerprint) return [];
    if (usedFingerprints.has(fingerprint)) return [];
    if (globallyUsedFingerprints.has(fingerprint)) return [];
    if (newlyReservedFingerprints.has(fingerprint)) return [];
    const scored = scoreCandidate(candidate, { route, context, aliases, preferHero });
    // Require an exact semantic overlap with the route. Context alone is not
    // enough because it previously selected unrelated writing/barber imagery.
    if (scored.routeMatches < 1 || scored.score < 12) return [];
    return [{ ...candidate, fingerprint, ...scored }];
  }).sort((a, b) => b.score - a.score || b.contextMatches - a.contextMatches || a.asset.localeCompare(b.asset));

  const best = ranked[0] ?? null;
  if (best) newlyReservedFingerprints.add(best.fingerprint);
  return best;
}

function replaceAtLine(file, lineNumber, sourceAsset, replacement) {
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split('\n');
  const index = lineNumber - 1;
  if (index < 0 || index >= lines.length || !lines[index].includes(sourceAsset)) return false;
  lines[index] = lines[index].replace(sourceAsset, replacement);
  fs.writeFileSync(file, lines.join('\n'));
  return true;
}

function fixWithinRoute(report) {
  let changed = 0;
  for (const finding of report.blocking?.withinRouteDuplicates ?? []) {
    const locations = (finding.ownedLocations ?? finding.locations ?? []).map(parseLocation).filter(Boolean);
    if (locations.length < 2) continue;

    for (const location of locations.slice(1)) {
      if (!fs.existsSync(location.file)) continue;
      const source = fs.readFileSync(location.file, 'utf8');
      const lines = source.split('\n');
      const line = lines[location.line - 1] ?? '';
      const sourceAsset = actualAliasOnLine(line, finding.aliases ?? [finding.asset]);
      if (!sourceAsset) continue;
      const candidate = pickCandidate({
        app: finding.app,
        route: finding.route,
        context: contextAt(lines, location.line),
        aliases: finding.aliases ?? [sourceAsset],
        usedFingerprints: usedFingerprintsInSource(finding.app, source),
        blockedFingerprint: String(finding.fingerprint || '').replace(/^sha256:/, ''),
      });
      if (!candidate) {
        console.warn(`[dedupe] manual review required: ${finding.app}:${finding.route} ${sourceAsset} @ ${location.file}:${location.line}`);
        continue;
      }
      if (replaceAtLine(location.file, location.line, sourceAsset, candidate.asset)) {
        globallyUsedFingerprints.add(candidate.fingerprint);
        console.log(`[dedupe] ${finding.app}:${finding.route} ${sourceAsset} -> ${candidate.asset} score=${candidate.score}`);
        changed += 1;
      }
    }
  }
  return changed;
}

function pageRecord(report, routeKey) {
  const [app, ...parts] = routeKey.split(':');
  const route = parts.join(':');
  return (report.routes ?? []).find((item) => item.app === app && item.route === route) ?? null;
}

function routeOwnedSourceFiles(pagePath) {
  const pageFile = path.join(ROOT, pagePath);
  const routeDir = path.dirname(pageFile);
  const files = walkFiles(routeDir, (file) => /\.(?:tsx|ts|jsx|js)$/.test(file));
  if (!files.includes(pageFile) && fs.existsSync(pageFile)) files.unshift(pageFile);
  return files;
}

function routeAffinity(aliases, routeKey) {
  const [, ...parts] = routeKey.split(':');
  return overlap(tokenize((aliases ?? []).join(' ')), tokenize(parts.join(':')));
}

function findHeroOccurrence(files, aliases) {
  const candidates = [];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const lines = source.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const asset = actualAliasOnLine(lines[i], aliases);
      if (!asset) continue;
      const context = contextAt(lines, i + 1, 5).replaceAll(asset, '');
      const heroScore = HERO_CONTEXT.test(context) ? 20 : 0;
      const earlyScore = Math.max(0, 8 - Math.floor(i / 35));
      candidates.push({ file, line: i + 1, asset, context, score: heroScore + earlyScore });
    }
  }
  return candidates.sort((a, b) => b.score - a.score || a.line - b.line)[0] ?? null;
}

function fixCrossRouteHeroes(report) {
  let changed = 0;
  for (const group of report.blocking?.crossRouteHeroDuplicates ?? []) {
    if (!group.routes?.length || group.routes.length < 2) continue;
    const aliases = group.aliases?.length ? group.aliases : [group.asset].filter(Boolean);
    const keep = [...group.routes].sort(
      (a, b) => routeAffinity(aliases, b) - routeAffinity(aliases, a) || a.localeCompare(b),
    )[0];

    for (const routeKey of group.routes) {
      if (routeKey === keep) continue;
      const record = pageRecord(report, routeKey);
      if (!record?.page) continue;
      const app = record.app;
      const occurrence = findHeroOccurrence(routeOwnedSourceFiles(record.page), aliases);
      if (!occurrence || occurrence.score < 20) {
        console.warn(`[hero-dedupe] manual review required: could not identify structural hero for ${routeKey}`);
        continue;
      }
      const source = fs.readFileSync(occurrence.file, 'utf8');
      const candidate = pickCandidate({
        app,
        route: record.route,
        context: occurrence.context,
        aliases,
        usedFingerprints: usedFingerprintsInSource(app, source),
        blockedFingerprint: String(group.fingerprint || '').replace(/^sha256:/, ''),
        preferHero: true,
      });
      if (!candidate) {
        console.warn(`[hero-dedupe] manual review required: no route-matched unused image for ${routeKey}`);
        continue;
      }
      if (replaceAtLine(occurrence.file, occurrence.line, occurrence.asset, candidate.asset)) {
        globallyUsedFingerprints.add(candidate.fingerprint);
        console.log(`[hero-dedupe] ${routeKey} ${occurrence.asset} -> ${candidate.asset} score=${candidate.score}`);
        changed += 1;
      }
    }
  }
  return changed;
}

let totalChanged = 0;
for (let pass = 1; pass <= 3; pass += 1) {
  console.log(`\n=== fingerprint-safe media dedupe pass ${pass} ===`);
  let report = runAudit();
  const before =
    (report.summary?.withinRouteDuplicates ?? 0) +
    (report.summary?.crossRouteHeroDuplicates ?? 0) +
    (report.summary?.heroRegistryDuplicates ?? 0);
  if (before === 0) break;

  const within = fixWithinRoute(report);
  report = runAudit();
  const heroes = fixCrossRouteHeroes(report);
  const changed = within + heroes;
  totalChanged += changed;
  console.log(`[dedupe] pass ${pass}: changed ${changed} references (${within} within-route, ${heroes} hero)`);
  if (changed === 0) break;
}

const finalReport = runAudit();
const remaining =
  (finalReport.summary?.withinRouteDuplicates ?? 0) +
  (finalReport.summary?.crossRouteHeroDuplicates ?? 0) +
  (finalReport.summary?.heroRegistryDuplicates ?? 0);
console.log(`\n[dedupe] total changed references: ${totalChanged}`);
console.log(`[dedupe] remaining blocking groups: ${remaining}`);
console.log('[dedupe] unresolved cases are intentionally left for manual review; the Integrity Gate remains authoritative.');
process.exit(0);
