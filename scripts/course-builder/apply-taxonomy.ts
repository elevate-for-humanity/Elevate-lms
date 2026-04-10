/* eslint-disable no-console */
/**
 * Applies domain, ojtCategory, hoursCredit, and structured competencyChecks
 * to every lesson seed file using the canonical taxonomy table.
 *
 * Rules:
 * - Does NOT rewrite lesson content, slugs, ordering, or module structure.
 * - hoursCredit = round(durationMin / 60, nearest 0.25)
 * - competencyChecks: converts existing string[] to CompetencyCheck[] with
 *   id (slug-derived), description (existing string), required: true for all.
 * - Idempotent: safe to re-run.
 *
 * Run: pnpm tsx scripts/course-builder/apply-taxonomy.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import type { BarberDomain, OJTCategory } from './types';

// ── Canonical taxonomy table ──────────────────────────────────────────────────
// slug → { domain, ojtCategory }
// hoursCredit is always derived from durationMin — never hardcoded here.

type TaxonomyEntry = { domain: BarberDomain; ojtCategory: OJTCategory };

const TAXONOMY: Record<string, TaxonomyEntry> = {
  // Module 1 — Infection Control & Safety
  'barber-lesson-1':              { domain: 'infection_control', ojtCategory: 'theory' },
  'barber-lesson-2':              { domain: 'infection_control', ojtCategory: 'sanitation' },
  'barber-lesson-3':              { domain: 'infection_control', ojtCategory: 'sanitation' },
  'barber-lesson-4':              { domain: 'infection_control', ojtCategory: 'sanitation' },
  'barber-lesson-5':              { domain: 'infection_control', ojtCategory: 'sanitation' },
  'barber-lesson-6':              { domain: 'laws_rules',        ojtCategory: 'theory' },
  'barber-module-1-checkpoint':   { domain: 'infection_control', ojtCategory: 'theory' },

  // Module 2 — Hair Science & Scalp Analysis
  'barber-lesson-8':              { domain: 'hair_science',      ojtCategory: 'theory' },
  'barber-lesson-9':              { domain: 'hair_science',      ojtCategory: 'theory' },
  'barber-lesson-10':             { domain: 'hair_science',      ojtCategory: 'theory' },
  'barber-lesson-11':             { domain: 'hair_science',      ojtCategory: 'client_service' },
  'barber-lesson-12':             { domain: 'consultation',      ojtCategory: 'client_service' },
  'barber-lesson-13':             { domain: 'consultation',      ojtCategory: 'client_service' },
  'barber-module-2-checkpoint':   { domain: 'hair_science',      ojtCategory: 'theory' },

  // Module 3 — Tools, Equipment & Ergonomics / Haircutting Fundamentals
  'barber-lesson-15':             { domain: 'haircutting',       ojtCategory: 'cutting' },
  'barber-lesson-16':             { domain: 'haircutting',       ojtCategory: 'cutting' },
  'barber-lesson-17':             { domain: 'haircutting',       ojtCategory: 'cutting' },
  'barber-lesson-18':             { domain: 'haircutting',       ojtCategory: 'cutting' },
  'barber-lesson-19':             { domain: 'haircutting',       ojtCategory: 'cutting' },
  'barber-lesson-20':             { domain: 'haircutting',       ojtCategory: 'client_service' },
  'barber-module-3-checkpoint':   { domain: 'haircutting',       ojtCategory: 'theory' },

  // Module 4 — Haircutting Techniques
  'barber-lesson-22':             { domain: 'haircutting',       ojtCategory: 'cutting' },
  'barber-lesson-23':             { domain: 'haircutting',       ojtCategory: 'cutting' },
  'barber-lesson-24':             { domain: 'haircutting',       ojtCategory: 'cutting' },
  'barber-lesson-25':             { domain: 'haircutting',       ojtCategory: 'cutting' },
  'barber-lesson-26':             { domain: 'haircutting',       ojtCategory: 'cutting' },
  'barber-lesson-27':             { domain: 'haircutting',       ojtCategory: 'cutting' },
  'barber-module-4-checkpoint':   { domain: 'haircutting',       ojtCategory: 'theory' },

  // Module 5 — Shaving & Beard Services
  'barber-lesson-29':             { domain: 'shaving',           ojtCategory: 'shaving' },
  'barber-lesson-30':             { domain: 'shaving',           ojtCategory: 'shaving' },
  'barber-lesson-31':             { domain: 'shaving',           ojtCategory: 'shaving' },
  'barber-lesson-32':             { domain: 'shaving',           ojtCategory: 'shaving' },
  'barber-lesson-33':             { domain: 'shaving',           ojtCategory: 'shaving' },
  'barber-module-5-checkpoint':   { domain: 'shaving',           ojtCategory: 'theory' },

  // Module 6 — Chemical Services
  'barber-lesson-35':             { domain: 'chemical_services', ojtCategory: 'chemical' },
  'barber-lesson-36':             { domain: 'chemical_services', ojtCategory: 'chemical' },
  'barber-lesson-37':             { domain: 'chemical_services', ojtCategory: 'chemical' },
  'barber-lesson-38':             { domain: 'chemical_services', ojtCategory: 'chemical' },
  'barber-module-6-checkpoint':   { domain: 'chemical_services', ojtCategory: 'theory' },

  // Module 7 — Professional & Business Skills
  'barber-lesson-40':             { domain: 'business',          ojtCategory: 'shop_ops' },
  'barber-lesson-41':             { domain: 'business',          ojtCategory: 'shop_ops' },
  'barber-lesson-42':             { domain: 'business',          ojtCategory: 'shop_ops' },
  'barber-lesson-43':             { domain: 'business',          ojtCategory: 'shop_ops' },
  'barber-lesson-44':             { domain: 'business',          ojtCategory: 'shop_ops' },
  'barber-module-7-checkpoint':   { domain: 'business',          ojtCategory: 'theory' },

  // Module 8 — State Board Exam Preparation
  'barber-lesson-46':             { domain: 'exam_prep',         ojtCategory: 'theory' },
  'barber-lesson-47':             { domain: 'exam_prep',         ojtCategory: 'theory' },
  'barber-lesson-48':             { domain: 'exam_prep',         ojtCategory: 'theory' },
  'barber-lesson-49':             { domain: 'exam_prep',         ojtCategory: 'theory' },
  'barber-module-8-checkpoint':   { domain: 'exam_prep',         ojtCategory: 'theory' },
  'barber-indiana-state-board-exam': { domain: 'exam_prep',      ojtCategory: 'theory' },
};

function roundToQuarter(n: number): number {
  return Math.round(n * 4) / 4;
}

function hoursFromMinutes(min: number): number {
  return roundToQuarter(min / 60);
}

// Convert a string competency description to a structured CompetencyCheck.
// id is derived from the description — lowercase, spaces to underscores, truncated.
function toCompetencyCheck(description: string, index: number): string {
  const id = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('_')
    || `check_${index}`;
  return `{ id: '${id}', description: '${description.replace(/'/g, "\\'")}', required: true }`;
}

// ── File transformer ──────────────────────────────────────────────────────────

function transformSeedFile(filePath: string): { changed: boolean; slugsPatched: string[] } {
  let src = fs.readFileSync(filePath, 'utf8');
  const original = src;
  const slugsPatched: string[] = [];

  for (const [slug, tax] of Object.entries(TAXONOMY)) {
    // Match lesson/checkpoint blocks by slug. We look for the slug declaration
    // and then inject fields after the durationMin line if not already present.
    const slugPattern = new RegExp(
      `(slug:\\s*'${slug}'[^}]*?durationMin:\\s*(\\d+),)`,
      's'
    );
    const match = slugPattern.exec(src);
    if (!match) continue;

    const block = match[1];
    const durationMin = parseInt(match[2], 10);
    const hoursCredit = hoursFromMinutes(durationMin);

    // Skip if already has domain (idempotent)
    if (src.includes(`slug: '${slug}'`) && src.match(new RegExp(`slug: '${slug}'[^}]*?domain:`,'s'))) {
      continue;
    }

    const injection = `\n      domain: '${tax.domain}',\n      ojtCategory: '${tax.ojtCategory}',\n      hoursCredit: ${hoursCredit},`;
    src = src.replace(block, block + injection);
    slugsPatched.push(slug);
  }

  // Convert string[] competencyChecks to CompetencyCheck[] where not yet converted.
  // Pattern: competencyChecks: [\n        'string1',\n        'string2', ...  ]
  src = src.replace(
    /competencyChecks:\s*\[([^\]]+?)\]/gs,
    (fullMatch: string, inner: string) => {
      // Already structured if it contains { id:
      if (inner.includes('{ id:')) return fullMatch;
      // Extract string items
      const items = [...inner.matchAll(/'([^']+)'/g)].map(m => m[1]);
      if (!items.length) return fullMatch;
      const structured = items.map((desc, i) => `        ${toCompetencyCheck(desc, i)}`).join(',\n');
      return `competencyChecks: [\n${structured},\n      ]`;
    }
  );

  const changed = src !== original;
  if (changed) fs.writeFileSync(filePath, src, 'utf8');
  return { changed, slugsPatched };
}

function main(): void {
  const seedDir = path.resolve(process.cwd(), 'scripts/course-builder/seeds');
  const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.seed.ts'));

  let totalPatched = 0;
  const allSlugsPatched: string[] = [];

  for (const file of files) {
    if (file === 'barber-course.seed.ts') continue; // index file — no lessons
    const filePath = path.join(seedDir, file);
    const { changed, slugsPatched } = transformSeedFile(filePath);
    if (changed) {
      console.log(`✓ ${file} — patched: ${slugsPatched.join(', ') || 'competencyChecks only'}`);
      totalPatched++;
      allSlugsPatched.push(...slugsPatched);
    } else {
      console.log(`  ${file} — no changes needed`);
    }
  }

  console.log(`\nPatched ${totalPatched} files, ${allSlugsPatched.length} lesson slugs updated.`);
}

main();
