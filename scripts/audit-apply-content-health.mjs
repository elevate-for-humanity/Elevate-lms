#!/usr/bin/env node
/**
 * Content/UX health check for Apply surfaces (static source analysis + optional HTTP).
 *
 * Usage:
 *   node scripts/audit-apply-content-health.mjs
 *   BASE_URL=https://www.elevateforhumanity.org node scripts/audit-apply-content-health.mjs --http
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const HTTP = process.argv.includes('--http');

const GRADIENT_ON_HERO_RE =
  /(bg-gradient-to-|from-black\/|via-black\/|to-black\/).*object-cover|object-cover[\s\S]{0,400}(bg-gradient-to-)/i;

const BANNED_HERO_TEXT_ON_VIDEO =
  /<h1[^>]*className="[^"]*text-white[^"]*"[^>]*>[\s\S]*?<\/h1>[\s\S]{0,200}<video/i;

async function loadSurfaces() {
  const mod = await import(pathToFileURL(path.join(ROOT, 'lib/apply/apply-surface-routes.ts')).href);
  return mod.APPLY_AUDIT_SURFACES;
}

function pagePath(href) {
  const p = href.split('?')[0].split('#')[0];
  return path.join(ROOT, 'app', p, 'page.tsx');
}

function analyzeSource(filePath) {
  if (!fs.existsSync(filePath)) return { issues: ['missing page.tsx'] };
  const src = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  if (GRADIENT_ON_HERO_RE.test(src)) issues.push('possible gradient overlay on hero image');
  if (BANNED_HERO_TEXT_ON_VIDEO.test(src)) issues.push('headline on video (forbidden)');
  if (!/heroBanners|HeroVideo|HeroPicture|<Image|InstitutionalHeader|apply-hero/i.test(src)) {
    if (!/redirect\s*\(/.test(src)) issues.push('no obvious hero image/banner/header');
  }
  const words = src.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (words < 120 && !/redirect\s*\(/.test(src)) issues.push(`sparse source (${words} words)`);
  return { issues, words };
}

async function httpCheck(href) {
  try {
    const res = await fetch(`${BASE}${href}`, { redirect: 'follow' });
    const html = await res.text();
    const issues = [];
    if (res.status >= 400) issues.push(`HTTP ${res.status}`);
    if (/bg-gradient-to-t.*object-cover/i.test(html)) issues.push('gradient overlay in HTML');
    if (html.length < 2500) issues.push('very short HTML response');
    return issues;
  } catch (e) {
    return [`fetch failed: ${e.message}`];
  }
}

async function stripeHealth() {
  const webhook = path.join(ROOT, 'app/api/webhooks/stripe/route.ts');
  const ok = fs.existsSync(webhook);
  const bnpl = fs.existsSync(path.join(ROOT, 'lib/bnpl-config.ts'));
  return { webhook: ok, bnplConfig: bnpl };
}

async function main() {
  const surfaces = await loadSurfaces();
  const stripe = await stripeHealth();
  const rows = [];
  let fail = 0;

  console.log('# Apply content health report\n');
  console.log(`Surfaces: ${surfaces.length}`);
  console.log(`Stripe webhook route: ${stripe.webhook ? 'OK' : 'MISSING'}`);
  console.log(`BNPL config: ${stripe.bnplConfig ? 'OK' : 'MISSING'}\n`);

  for (const s of surfaces) {
    const fp = pagePath(s.href);
    const { issues: srcIssues } = analyzeSource(fp);
    const httpIssues = HTTP ? await httpCheck(s.href) : [];
    const issues = [...srcIssues, ...httpIssues];
    if (issues.length) fail++;
    rows.push({ ...s, file: path.relative(ROOT, fp), issues });
  }

  for (const r of rows) {
    const flag = r.issues.length ? 'WARN' : 'OK';
    console.log(`[${flag}] ${r.name}`);
    console.log(`  ${r.href}`);
    if (r.issues.length) console.log(`  → ${r.issues.join('; ')}`);
  }

  console.log(`\n${fail} surface(s) with warnings.`);
  console.log('\nManual QA checklist: docs/audits/apply-pages-health-checklist.md');
  console.log('Gold standard page: /programs/barber-apprenticeship\n');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
