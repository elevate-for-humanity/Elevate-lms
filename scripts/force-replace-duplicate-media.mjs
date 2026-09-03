#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const REPORT = path.join(ROOT, 'docs/audits/PLATFORM_MEDIA_DUPLICATES.json');
const AUDIT = path.join(ROOT, 'scripts/audit-platform-media-duplicates.mjs');
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const reusable = /(?:logo|favicon|icon|badge|seal|partner|sponsor|credential|certification|qr|avatar|headshot|placeholder|watermark)/i;

function walk(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'archive', 'deprecated', '__snapshots__'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

function hash(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function assetPath(file) {
  return '/' + path.relative(path.join(ROOT, 'public'), file).replaceAll('\\', '/');
}

function effectiveFile(app, asset) {
  const rel = asset.replace(/^\/+/, '');
  for (const candidate of [path.join(ROOT, 'apps', app, 'public', rel), path.join(ROOT, 'public', rel)]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function assetHash(app, asset) {
  const file = effectiveFile(app, asset);
  return file ? hash(file) : null;
}

function runAudit() {
  try {
    execFileSync(process.execPath, [AUDIT], { cwd: ROOT, stdio: 'inherit' });
  } catch {
    // Expected until all duplicate groups are removed.
  }
  return JSON.parse(fs.readFileSync(REPORT, 'utf8'));
}

const candidates = walk(path.join(ROOT, 'public/images'), (file) => {
  return EXT.has(path.extname(file).toLowerCase()) && !reusable.test(assetPath(file));
}).map((file) => ({ file, asset: assetPath(file), fingerprint: hash(file) }));

function sourceAssets(source) {
  const re = /['"](\/(?:images|uploads|media)\/[^'"\s)]+)['"]/g;
  return [...source.matchAll(re)].map((m) => m[1].split(/[?#]/)[0]);
}

function buildUsedFingerprints() {
  const used = new Set();
  for (const app of ['marketing', 'lms', 'admin']) {
    for (const file of walk(path.join(ROOT, 'apps', app, 'app'), (f) => /\.(?:tsx|ts|jsx|js)$/.test(f))) {
      const source = fs.readFileSync(file, 'utf8');
      for (const asset of sourceAssets(source)) {
        const fp = assetHash(app, asset);
        if (fp) used.add(fp);
      }
    }
  }
  return used;
}

function findOccurrence(pagePath, aliases) {
  const pageFile = path.join(ROOT, pagePath);
  const dir = path.dirname(pageFile);
  const files = [pageFile, ...walk(dir, (f) => /\.(?:tsx|ts|jsx|js)$/.test(f) && f !== pageFile)];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, 'utf8');
    for (const alias of aliases) {
      const index = source.indexOf(alias);
      if (index >= 0) return { file, source, alias, index };
    }
  }
  return null;
}

function replaceOnce(occurrence, replacement) {
  const next = occurrence.source.slice(0, occurrence.index) + replacement + occurrence.source.slice(occurrence.index + occurrence.alias.length);
  fs.writeFileSync(occurrence.file, next);
}

let total = 0;
for (let pass = 1; pass <= 4; pass += 1) {
  const report = runAudit();
  const groups = report.blocking?.crossRouteHeroDuplicates ?? [];
  if (!groups.length) break;

  const records = new Map((report.routes ?? []).map((r) => [`${r.app}:${r.route}`, r]));
  const used = buildUsedFingerprints();
  const reserved = new Set();
  let changed = 0;

  for (const group of groups) {
    const aliases = group.aliases?.length ? group.aliases : [group.asset].filter(Boolean);
    const blocked = String(group.fingerprint || '').replace(/^sha256:/, '');
    const routes = group.routes ?? [];

    // Keep the first route as-is and force unique replacements for every other route.
    for (const routeKey of routes.slice(1)) {
      const record = records.get(routeKey);
      if (!record?.page) continue;
      const occurrence = findOccurrence(record.page, aliases);
      if (!occurrence) {
        console.warn(`[force-media] no alias occurrence found for ${routeKey}`);
        continue;
      }

      const replacement = candidates.find((candidate) => {
        if (candidate.fingerprint === blocked) return false;
        if (used.has(candidate.fingerprint)) return false;
        if (reserved.has(candidate.fingerprint)) return false;
        return true;
      });

      if (!replacement) {
        console.warn(`[force-media] no unused candidate available for ${routeKey}`);
        continue;
      }

      replaceOnce(occurrence, replacement.asset);
      used.add(replacement.fingerprint);
      reserved.add(replacement.fingerprint);
      changed += 1;
      total += 1;
      console.log(`[force-media] ${routeKey}: ${occurrence.alias} -> ${replacement.asset}`);
    }
  }

  console.log(`[force-media] pass ${pass}: ${changed} replacement(s)`);
  if (!changed) break;
}

const finalReport = runAudit();
console.log(`[force-media] total replacements: ${total}`);
console.log(`[force-media] remaining cross-route hero groups: ${finalReport.summary?.crossRouteHeroDuplicates ?? 0}`);
