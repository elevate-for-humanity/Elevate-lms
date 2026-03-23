#!/usr/bin/env tsx
/**
 * enforce-hvac-legacy-removal-state
 *
 * Enforces consistency between the renderer branch state and the tracked
 * legacy file state. Two invariants:
 *
 *   1. If legacy_hvac branch EXISTS in renderer → all tracked legacy files
 *      must also exist (no partial cleanup).
 *
 *   2. If legacy_hvac branch is ABSENT from renderer → all tracked legacy
 *      files must also be absent (deletion must be atomic).
 *
 * This script runs in CI on every PR and does not require DB access.
 * It catches the most common mistake: someone deletes the renderer branch
 * without deleting the legacy files, or vice versa.
 *
 * Run: pnpm verify:hvac-legacy-removal-state
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function fail(message: string): never {
  console.error(`\n[enforce-hvac-legacy-removal-state] FAIL: ${message}\n`);
  process.exit(1);
}

function exists(relPath: string): boolean {
  return fs.existsSync(path.resolve(process.cwd(), relPath));
}

function fileContains(relPath: string, needle: string): boolean {
  const full = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(full)) return false;
  return fs.readFileSync(full, 'utf8').includes(needle);
}

// ── State ─────────────────────────────────────────────────────────────────────

const RENDERER = 'components/lms/LessonContentRenderer.tsx';
const KILL_SWITCH = 'lib/flags/hvacLegacyRetirement.ts';
const RETIREMENT_STUB = 'supabase/migrations/20270101000001_drop_legacy_hvac_content_path.sql';
const CHECKLIST = 'docs/hvac-legacy-retirement-checklist.md';
const MERGE_POLICY = 'docs/hvac-legacy-retirement-merge-policy.md';

const TRACKED_LEGACY_FILES = [
  'lib/legacy-hvac/getLegacyHvacContent.ts',
  'lib/legacy-hvac/mapTrainingLessonToLms.ts',
  'lib/legacy-hvac/resolveLegacyHvacSimulation.ts',
];

// The full set of lib/courses/hvac-*.ts and lib/lms/hvac-*.ts files that must
// be deleted atomically with the renderer branch removal.
const HVAC_STATIC_FILES = [
  'lib/courses/hvac-captions.ts',
  'lib/courses/hvac-completion-workflow.ts',
  'lib/courses/hvac-content-builder.ts',
  'lib/courses/hvac-csv-loader.ts',
  'lib/courses/hvac-diagnostic-exercises.ts',
  'lib/courses/hvac-epa-tags.ts',
  'lib/courses/hvac-epa608-lessons.ts',
  'lib/courses/hvac-epa608-prep.ts',
  'lib/courses/hvac-equipment-models.ts',
  'lib/courses/hvac-labs.ts',
  'lib/courses/hvac-lesson-content.ts',
  'lib/courses/hvac-lesson-number-map.ts',
  'lib/courses/hvac-lesson-quizzes.ts',
  'lib/courses/hvac-lesson5-captions.ts',
  'lib/courses/hvac-lesson5-recap.ts',
  'lib/courses/hvac-module-data.ts',
  'lib/courses/hvac-ojt-competencies.ts',
  'lib/courses/hvac-procedures.ts',
  'lib/courses/hvac-program-metadata.ts',
  'lib/courses/hvac-quick-checks.ts',
  'lib/courses/hvac-quiz-banks.ts',
  'lib/courses/hvac-quiz-map.ts',
  'lib/courses/hvac-quizzes.ts',
  'lib/courses/hvac-recaps.ts',
  'lib/courses/hvac-service-scenarios.ts',
  'lib/courses/hvac-tool-breakdowns.ts',
  'lib/courses/hvac-troubleshooting-sims.ts',
  'lib/courses/hvac-uuids.ts',
  'lib/courses/hvac-video-map.ts',
  'lib/courses/hvac-visual-library.ts',
  'lib/lms/hvac-enrichment.ts',
  'lib/lms/hvac-simulations.ts',
];

// ── Directory walker ──────────────────────────────────────────────────────────

function walk(dir: string): string[] {
  const full = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(full)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      results.push(...walk(rel));
    } else {
      results.push(rel.replace(/\\/g, '/'));
    }
  }
  return results;
}

// Approved legacy file set — union of all tracked lists plus discovered variants
const APPROVED_LEGACY_FILE_SET = new Set([
  ...TRACKED_LEGACY_FILES,
  ...HVAC_STATIC_FILES,
  'lib/courses/hvac-module-content.ts',
  'lib/courses/hvac-module-content.tsx',
  // hvac-sims subdirectory — discovered by walk, must be deleted in retirement PR
  'lib/courses/hvac-sims/index.ts',
  'lib/courses/hvac-sims/loader.ts',
  'lib/courses/hvac-sims/registry.ts',
  'lib/courses/hvac-sims/schema.ts',
]);

// ── Checks ────────────────────────────────────────────────────────────────────

const legacyBranchExists = fileContains(RENDERER, "case 'legacy_hvac'");
const killSwitchExists = exists(KILL_SWITCH);
const retirementStubExists = exists(RETIREMENT_STUB);
const checklistExists = exists(CHECKLIST);

const trackedPresent = TRACKED_LEGACY_FILES.filter(exists);
const trackedAbsent = TRACKED_LEGACY_FILES.filter((f) => !exists(f));

const hvacStaticPresent = HVAC_STATIC_FILES.filter(exists);
const hvacStaticAbsent = HVAC_STATIC_FILES.filter((f) => !exists(f));

let ok = true;

// ── Invariant A: renderer branch and tracked files must be in sync ────────────

if (legacyBranchExists && trackedAbsent.length > 0) {
  console.error(
    '[enforce-hvac-legacy-removal-state] FAIL: legacy_hvac renderer branch exists ' +
      'but tracked legacy files are missing. These must be present together:\n' +
      trackedAbsent.map((f) => `  - ${f}`).join('\n')
  );
  ok = false;
}

if (!legacyBranchExists && trackedPresent.length > 0) {
  console.error(
    '[enforce-hvac-legacy-removal-state] FAIL: legacy_hvac renderer branch was removed ' +
      'but tracked legacy files remain. Delete these in the same PR:\n' +
      trackedPresent.map((f) => `  - ${f}`).join('\n')
  );
  ok = false;
}

// ── Invariant B: if renderer branch removed, all hvac static files must go too ─

if (!legacyBranchExists && hvacStaticPresent.length > 0) {
  console.error(
    '[enforce-hvac-legacy-removal-state] FAIL: legacy_hvac renderer branch was removed ' +
      'but HVAC static lib files remain. Delete these in the same PR:\n' +
      hvacStaticPresent.map((f) => `  - ${f}`).join('\n')
  );
  ok = false;
}

// ── Invariant C: partial deletion of hvac static files is not allowed ─────────
// Either all are present (pre-retirement) or all are absent (post-retirement).

if (legacyBranchExists && hvacStaticAbsent.length > 0 && hvacStaticAbsent.length < HVAC_STATIC_FILES.length) {
  console.error(
    '[enforce-hvac-legacy-removal-state] FAIL: partial deletion of HVAC static files detected. ' +
      'These files must all be deleted atomically in the retirement PR:\n' +
      hvacStaticAbsent.map((f) => `  - ${f} (missing)`).join('\n')
  );
  ok = false;
}

// ── Invariant D: kill switch must exist while renderer branch exists ───────────

if (legacyBranchExists && !killSwitchExists) {
  console.error(
    '[enforce-hvac-legacy-removal-state] FAIL: legacy_hvac renderer branch exists ' +
      `but kill switch is missing: ${KILL_SWITCH}`
  );
  ok = false;
}

// ── Invariant E: retirement stub must exist while renderer branch exists ───────

if (legacyBranchExists && !retirementStubExists) {
  console.error(
    '[enforce-hvac-legacy-removal-state] FAIL: legacy_hvac renderer branch exists ' +
      `but retirement stub migration is missing: ${RETIREMENT_STUB}`
  );
  ok = false;
}

// ── Invariant F: checklist and merge policy must exist while renderer branch exists

if (legacyBranchExists && !checklistExists) {
  console.error(
    '[enforce-hvac-legacy-removal-state] FAIL: legacy_hvac renderer branch exists ' +
      `but retirement checklist is missing: ${CHECKLIST}`
  );
  ok = false;
}

const mergePolicyExists = exists(MERGE_POLICY);
if (legacyBranchExists && !mergePolicyExists) {
  console.error(
    '[enforce-hvac-legacy-removal-state] FAIL: legacy_hvac renderer branch exists ' +
      `but merge policy is missing: ${MERGE_POLICY}`
  );
  ok = false;
}

// ── Invariant G: no new HVAC legacy files outside the approved set ────────────
// Discovers all hvac-*.ts/tsx files in lib/courses, lib/lms, lib/legacy-hvac
// and fails if any are outside the approved tracked set.

const discoveredLegacyFiles = [
  ...walk('lib/courses').filter((f) => /\/hvac-.*\.(ts|tsx)$/.test(f)),
  ...walk('lib/lms').filter((f) => /\/hvac-.*\.(ts|tsx)$/.test(f)),
  ...walk('lib/legacy-hvac').filter((f) => /\.(ts|tsx)$/.test(f)),
];

const unexpectedLegacyFiles = discoveredLegacyFiles.filter(
  (f) => !APPROVED_LEGACY_FILE_SET.has(f)
);

if (unexpectedLegacyFiles.length > 0) {
  console.error(
    '[enforce-hvac-legacy-removal-state] FAIL: unexpected HVAC legacy files found outside approved tracked set.\n' +
      'These files were not present when the retirement framework was established.\n' +
      'Either delete them or add them to HVAC_STATIC_FILES in this script with a justification:\n' +
      unexpectedLegacyFiles.sort().map((f) => `  - ${f}`).join('\n')
  );
  ok = false;
}

// ── Result ────────────────────────────────────────────────────────────────────

if (!ok) {
  fail(
    'Repo state is inconsistent. Fix the issues above before merging.\n' +
      'See docs/hvac-legacy-retirement-checklist.md for the correct deletion sequence.'
  );
}

console.log(
  `[enforce-hvac-legacy-removal-state] OK :: ` +
    `legacyBranchExists=${legacyBranchExists}, ` +
    `trackedFilesPresent=${trackedPresent.length}/${TRACKED_LEGACY_FILES.length}, ` +
    `hvacStaticPresent=${hvacStaticPresent.length}/${HVAC_STATIC_FILES.length}, ` +
    `killSwitchExists=${killSwitchExists}, ` +
    `retirementStubExists=${retirementStubExists}`
);
