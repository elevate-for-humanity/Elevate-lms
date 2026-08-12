#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const AUDIT_SCRIPT = path.join(ROOT, 'scripts/audit-platform-media-duplicates.mjs');
const REPORT_PATH = path.join(ROOT, 'docs/audits/PLATFORM_MEDIA_DUPLICATES.json');
const IMAGE_ROOT = path.join(ROOT, 'public/images');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const REUSABLE_MEDIA = /(?:logo|favicon|icon|badge|seal|partner|sponsor|credential|certification|qr|avatar|headshot|placeholder|watermark)/i;
const HERO_CONTEXT = /(?:HeroPicture|HeroVideo|PictureFirstPageHero|ModernLandingHero|heroImage|posterImage|heroSrc|heroMedia|\bhero\b|\bbanner\b)/i;
const STOP = new Set([
  'app','apps','page','pages','image','images','hero','heroes','banner','marketing','admin','lms','store',
  'program','programs','dashboard','portal','the','and','for','with','from','your','our','this','that','into',
  'new','slug','id','course','module','assessment','apply','verify','www','webp','jpg','jpeg','png','avif',
]);

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

const MEDIA = walkFiles(
  IMAGE_ROOT,
  (file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()) && !REUSABLE_MEDIA.test(webPath(file)),
).map((file) => {
  const asset = webPath(file);
  return {
    asset,
    tokens: tokenize(asset),
    heroish: /(?:hero|banner|page-1|overview|landing)/i.test(path.basename(asset)),
  };
});

if (!MEDIA.length) throw new Error('No candidate media files found under public/images');

function runAudit() {
  try {
    execFileSync(process.execPath, [AUDIT_SCRIPT], { cwd: ROOT, stdio: 'inherit' });
  } catch {
    // Blocking findings are expected while the fixer is working.
  }
  return JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
}

function sourceAssets(source) {
  return new Set(
    [...source.matchAll(/['"](\/(?:images|uploads|media)\/[^'"\s)]+)['"]/g)].map((m) => m[1].split(/[?#]/)[0]),
  );
}

function scoreCandidate(candidate, { route, context, sourceAsset, preferHero }) {
  const routeTokens = tokenize(route);
  const contextTokens = tokenize(context);
  const sourceTokens = tokenize(sourceAsset);
  let score = 0;
  score += overlap(candidate.tokens, routeTokens) * 9;
  score += overlap(candidate.tokens, contextTokens) * 3;
  score += overlap(candidate.tokens, sourceTokens) * 2;
  if (preferHero && candidate.heroish) score += 2;
  if (/\/pages\//.test(candidate.asset)) score += 1;
  return score;
}

function pickCandidate({ route, context, sourceAsset, used, reservedHero = new Set(), preferHero = false }) {
  const ranked = MEDIA
    .filter((candidate) => candidate.asset !== sourceAsset)
    .filter((candidate) => !used.has(candidate.asset))
    .filter((candidate) => !preferHero || !reservedHero.has(candidate.asset))
    .map((candidate) => ({
      ...candidate,
      score: scoreCandidate(candidate, { route, context, sourceAsset, preferHero }),
    }))
    .sort((a, b) => b.score - a.score || a.asset.localeCompare(b.asset));

  const best = ranked[0];
  if (!best || best.score < 4) return null;
  return best.asset;
}

function parseLocation(location) {
  const match = String(location).match(/^(.*):(\d+)$/);
  if (!match) return null;
  return { file: path.join(ROOT, match[1]), line: Number(match[2]) };
}

function contextAt(lines, lineNumber, radius = 4) {
  const index = Math.max(0, lineNumber - 1);
  return lines.slice(Math.max(0, index - radius), Math.min(lines.length, index + radius + 1)).join(' ');
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

    // Preserve the first visible use and replace later uses with route/context-specific existing assets.
    for (const location of locations.slice(1)) {
      if (!fs.existsSync(location.file)) continue;
      const source = fs.readFileSync(location.file, 'utf8');
      const lines = source.split('\n');
      if (!lines[location.line - 1]?.includes(finding.asset)) continue;
      const used = sourceAssets(source);
      const context = contextAt(lines, location.line, 6);
      const replacement = pickCandidate({
        route: finding.route,
        context,
        sourceAsset: finding.asset,
        used,
      });
      if (!replacement) {
        console.warn(`[dedupe] no high-confidence replacement: ${finding.app}:${finding.route} ${finding.asset} @ ${location.file}:${location.line}`);
        continue;
      }
      if (replaceAtLine(location.file, location.line, finding.asset, replacement)) {
        console.log(`[dedupe] ${finding.app}:${finding.route} ${finding.asset} -> ${replacement}`);
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

function assetRouteAffinity(asset, routeKey) {
  const [, ...parts] = routeKey.split(':');
  return overlap(tokenize(asset), tokenize(parts.join(':')));
}

function findHeroOccurrence(files, asset) {
  const candidates = [];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const lines = source.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      if (!lines[i].includes(asset)) continue;
      const context = contextAt(lines, i + 1, 5);
      const heroScore = HERO_CONTEXT.test(context) ? 10 : 0;
      const earlyScore = Math.max(0, 6 - Math.floor(i / 40));
      candidates.push({ file, line: i + 1, context, score: heroScore + earlyScore });
    }
  }
  return candidates.sort((a, b) => b.score - a.score || a.line - b.line)[0] ?? null;
}

function fixCrossRouteHeroes(report) {
  let changed = 0;
  const reservedHero = new Set();
  for (const group of report.blocking?.crossRouteHeroDuplicates ?? []) reservedHero.add(group.asset);

  for (const group of report.blocking?.crossRouteHeroDuplicates ?? []) {
    if (!group.routes?.length || group.routes.length < 2) continue;
    const keep = [...group.routes].sort(
      (a, b) => assetRouteAffinity(group.asset, b) - assetRouteAffinity(group.asset, a) || a.localeCompare(b),
    )[0];

    for (const routeKey of group.routes) {
      if (routeKey === keep) continue;
      const record = pageRecord(report, routeKey);
      if (!record?.page) continue;
      const files = routeOwnedSourceFiles(record.page);
      const occurrence = findHeroOccurrence(files, group.asset);
      if (!occurrence) {
        console.warn(`[hero-dedupe] unable to locate ${group.asset} for ${routeKey}`);
        continue;
      }

      const source = fs.readFileSync(occurrence.file, 'utf8');
      const used = sourceAssets(source);
      const route = record.route;
      const replacement = pickCandidate({
        route,
        context: occurrence.context,
        sourceAsset: group.asset,
        used,
        reservedHero,
        preferHero: true,
      });
      if (!replacement) {
        console.warn(`[hero-dedupe] no high-confidence replacement: ${routeKey} ${group.asset}`);
        continue;
      }
      if (replaceAtLine(occurrence.file, occurrence.line, group.asset, replacement)) {
        reservedHero.add(replacement);
        console.log(`[hero-dedupe] ${routeKey} ${group.asset} -> ${replacement}`);
        changed += 1;
      }
    }
  }
  return changed;
}

let totalChanged = 0;
for (let pass = 1; pass <= 4; pass += 1) {
  console.log(`\n=== media dedupe pass ${pass} ===`);
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

// Do not hide unresolved cases. The caller commits deterministic fixes, while the
// Integrity Gate remains authoritative and will continue to fail until blockers are zero.
process.exit(0);
