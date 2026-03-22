/**
 * audit-hero-banners.ts — pre-merge gate for internal program hero banners.
 *
 * Exits with code 1 if any banner fails. Use as a CI check or pre-merge step.
 *
 * Usage:
 *   pnpm audit:hero-banners
 *   npx tsx scripts/audit-hero-banners.ts
 *
 * Mirrors programBanner() validator exactly — no separate rule set to drift.
 */

import { internalProgramHeroBanners } from '../content/heroBanners';
import type { ProgramHeroBannerConfig } from '../content/heroBanners';

const BANNED_PHRASES = [
  'rewarding career', 'exciting future', 'in-demand', 'career-ready',
  'next step', 'start your journey', 'launch your career', 'transform your life',
  'bright future', 'take the next step',
];

function auditBanner(slug: string, b: ProgramHeroBannerConfig): string[] {
  const issues: string[] = [];
  const t = b.transcript;
  const exempt = b.salaryExempt === true;

  if (!b.credentialLabel?.trim()) issues.push('credentialLabel is empty');
  if (!b.durationLabel?.trim())   issues.push('durationLabel is empty');
  if (!/\d+/.test(b.durationLabel ?? ''))
    issues.push(`durationLabel "${b.durationLabel}" has no numeric value`);

  if (exempt) {
    if (!b.salaryNote?.trim())
      issues.push('salaryExempt:true requires a non-empty salaryNote');
  } else {
    const sal = b.salaryRangeLabel ?? '';
    if (!sal.trim())
      issues.push('salaryRangeLabel is empty — set salaryExempt:true with salaryNote to exempt');
    else if (!/\$\d{2,3},?\d{3}/.test(sal))
      issues.push(`salaryRangeLabel "${sal}" does not match $NN,NNN format`);
  }

  if (b.microLabel.trim().split(/\s+/).length > 4)
    issues.push(`microLabel "${b.microLabel}" exceeds 4 words`);

  const ti = b.trustIndicators;
  if (!Array.isArray(ti) || ti.length < 4 || ti.length > 6)
    issues.push(`trustIndicators count: ${ti?.length ?? 0} (must be 4–6)`);
  else {
    const deduped = new Set(ti.map((x) => x.trim().toLowerCase()));
    if (deduped.size !== ti.length) issues.push('trustIndicators contains duplicates');
  }

  if (t.length < 180 || t.length > 360)
    issues.push(`transcript ${t.length} chars (must be 180–360)`);
  if (b.credentialLabel && !t.includes(b.credentialLabel))
    issues.push(`transcript missing credentialLabel: "${b.credentialLabel}"`);
  if (b.durationLabel && !t.includes(b.durationLabel))
    issues.push(`transcript missing durationLabel: "${b.durationLabel}"`);
  if (!exempt && b.salaryRangeLabel && !t.includes(b.salaryRangeLabel))
    issues.push(`transcript missing salaryRangeLabel: "${b.salaryRangeLabel}"`);

  const hit = BANNED_PHRASES.find((p) => t.toLowerCase().includes(p));
  if (hit) issues.push(`banned phrase: "${hit}"`);
  if (!/[.?!]$/.test(t.trim())) issues.push('transcript does not end with punctuation');

  return issues;
}

const entries = Object.entries(internalProgramHeroBanners);
let failures = 0;

for (const [slug, b] of entries) {
  const issues = auditBanner(slug, b);
  const exempt = b.salaryExempt === true;
  const salDisplay = exempt
    ? `EXEMPT (${b.salaryNote?.slice(0, 35)}...)`
    : (b.salaryRangeLabel ?? '(missing)');

  if (issues.length > 0) {
    console.error(`\nFAIL ${slug}`);
    issues.forEach((i) => console.error(`   * ${i}`));
    failures++;
  } else {
    console.log(
      `OK   ${slug.padEnd(42)} ${b.transcript.length}c` +
      `  "${b.credentialLabel}" / ${b.durationLabel} / ${salDisplay}`
    );
  }
}

console.log(`\n${'─'.repeat(80)}`);
console.log(`Audited ${entries.length} internal program banners.`);

if (failures > 0) {
  console.error(`\n${failures} banner(s) FAILED. Fix before merging.\n`);
  process.exit(1);
} else {
  console.log('All banners pass.\n');
}
