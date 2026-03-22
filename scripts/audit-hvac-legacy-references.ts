#!/usr/bin/env tsx
/**
 * audit-hvac-legacy-references
 *
 * Scans .ts/.tsx/.js/.jsx/.mjs files for references to HVAC legacy paths
 * and fails if any file outside the approved set still references them.
 *
 * Two modes:
 *
 *   PRE-RETIREMENT (legacy_hvac branch present in renderer):
 *     Fails if any file outside ALLOWED_PRE_RETIREMENT references a legacy
 *     HVAC pattern. Catches new imports being introduced. Every file in the
 *     pre-retirement list must be deleted in the retirement PR.
 *
 *   POST-RETIREMENT (legacy_hvac branch absent):
 *     Zero tolerance. Only ALLOWED_POST_RETIREMENT may reference legacy
 *     patterns. Any other reference is a hard failure.
 *
 * Run: pnpm audit:hvac-legacy-refs
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// ── Post-retirement allowlist (zero-tolerance target state) ───────────────────
// After the retirement PR merges, ONLY these files may reference legacy patterns.
const ALLOWED_POST_RETIREMENT = new Set([
  'scripts/enforce-hvac-legacy-removal-state.ts',
  'scripts/verify-hvac-legacy-retirement.ts',
  'scripts/audit-hvac-legacy-references.ts',
  'scripts/hvac-legacy-readiness.ts',
  'tests/unit/hvac-legacy-retirement-guard.test.ts',
  'tests/unit/hvac-legacy-kill-switch.test.ts',
  'tests/unit/hvac-legacy-kill-switch-cutover.test.ts',
]);

// ── Pre-retirement allowlist (deletion tracking list) ─────────────────────────
// Every file here is a known legacy importer that must be deleted in the
// retirement PR. Adding a file here is not permanent approval — it is tracking.
const ALLOWED_PRE_RETIREMENT = new Set([
  // Retirement infrastructure (always allowed)
  ...ALLOWED_POST_RETIREMENT,

  // Renderer — contains the legacy_hvac case
  'components/lms/LessonContentRenderer.tsx',

  // Kill switch flag
  'lib/flags/hvacLegacyRetirement.ts',

  // Tracked consolidation files
  'lib/legacy-hvac/getLegacyHvacContent.ts',
  'lib/legacy-hvac/mapTrainingLessonToLms.ts',
  'lib/legacy-hvac/resolveLegacyHvacSimulation.ts',

  // HVAC static lib files (internal cross-references)
  'lib/lms/hvac-enrichment.ts',
  'lib/lms/hvac-simulations.ts',
  'lib/lms/get-lesson-render-mode.ts',       // routes to legacy_hvac mode
  'lib/lms/program-curriculum.ts',           // references HVAC course ID

  // HVAC static lib files with internal cross-references
  'lib/courses/hvac-content-builder.ts',
  'lib/courses/hvac-lesson-quizzes.ts',
  'lib/courses/hvac-ojt-competencies.ts',
  'lib/courses/hvac-program-metadata.ts',
  'lib/courses/hvac-quizzes.ts',
  'lib/courses/hvac-troubleshooting-sims.ts',

  // App routes
  'app/api/admin/certifications/review/route.ts',
  'app/api/admin/sync-course-definitions/route.ts',
  'app/api/certifications/submit/route.ts',
  'app/api/courses/[courseId]/lessons/public/route.ts',
  'app/api/hvac/advance-workflow/route.ts',
  'app/api/lessons/[lessonId]/complete/route.ts',
  'app/course-preview/hvac-technician/page.tsx',
  'app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx',
  'app/programs/hvac-technician/course/HvacCourseHome.tsx',
  'app/programs/hvac-technician/course/QuizPanel.tsx',

  // Components
  'components/hvac-labs/EPA608PracticeExam.tsx',
  'components/hvac-labs/GaugeReadingLab.tsx',
  'components/lms/HvacLessonEnrichment.tsx',
  'components/lms/HvacLessonVideo.tsx',
  'components/lms/HvacQuizBlock.tsx',
  'components/lms/LessonVideoWithSimulation.tsx',
  'components/lms/PTChartDrill.tsx',
  'components/lms/UniversalPracticeExam.tsx',

  // Lib
  'lib/ai-instructor/hvac-instructor-prompt.ts',

  // Scripts
  'scripts/assemble-hvac-v16.mjs',
  'scripts/build-hvac-manifest.mjs',
  'scripts/build-lesson-manifests.ts',
  'scripts/generate-course-preview-videos.ts',
  'scripts/generate-hvac-audio.ts',
  'scripts/generate-hvac-videos-did.ts',
  'scripts/generate-hvac-videos.ts',
  'scripts/generate-missing-hvac-media.ts',
  'scripts/generate-slide-video.ts',
  'scripts/import-hvac-curriculum.ts',
  'scripts/micro-release-lesson.ts',
  'scripts/upload-hvac-audio-to-storage.ts',

  // Tests
  'tests/unit/get-lesson-render-mode.test.ts',
]);

// ── Legacy patterns ───────────────────────────────────────────────────────────
const LEGACY_PATTERNS = [
  'lib/legacy-hvac/',
  'lib/lms/hvac-',
  'lib/courses/hvac-',
  'legacy_hvac',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fail(message: string): never {
  console.error(`\nHVAC legacy reference audit failed: ${message}\n`);
  process.exit(1);
}

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function search(pattern: string): string[] {
  // Scope to code files only — exclude markdown, SQL, YAML, JSON
  const includeFlags = [
    '--include=*.ts', '--include=*.tsx',
    '--include=*.js', '--include=*.jsx', '--include=*.mjs',
  ].join(' ');

  try {
    const out = execSync(
      `grep -RIn --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git ${includeFlags} ${JSON.stringify(pattern)} .`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    ).trim();
    if (!out) return [];
    return out
      .split('\n')
      .map((line) => line.split(':')[0])
      .map((file) => normalize(path.relative(ROOT, path.resolve(ROOT, file))))
      .filter(Boolean);
  } catch (error: unknown) {
    const e = error as { stdout?: string };
    if (typeof e?.stdout === 'string' && e.stdout.trim()) {
      return e.stdout
        .trim()
        .split('\n')
        .map((line: string) => line.split(':')[0])
        .map((file: string) => normalize(path.relative(ROOT, path.resolve(ROOT, file))))
        .filter(Boolean);
    }
    return [];
  }
}

function fileContains(relPath: string, needle: string): boolean {
  const full = path.resolve(ROOT, relPath);
  if (!fs.existsSync(full)) return false;
  return fs.readFileSync(full, 'utf8').includes(needle);
}

// ── Main ──────────────────────────────────────────────────────────────────────

const legacyBranchExists = fileContains(
  'components/lms/LessonContentRenderer.tsx',
  "case 'legacy_hvac'"
);

const allowedFiles = legacyBranchExists ? ALLOWED_PRE_RETIREMENT : ALLOWED_POST_RETIREMENT;

console.log(
  `\n[audit-hvac-legacy-references] mode=${legacyBranchExists ? 'pre-retirement' : 'post-retirement'}`
);

const offenders = new Set<string>();
for (const pattern of LEGACY_PATTERNS) {
  for (const file of search(pattern)) {
    if (!allowedFiles.has(file)) {
      offenders.add(file);
    }
  }
}

if (offenders.size > 0) {
  fail(
    `found disallowed references outside approved set:\n` +
      [...offenders].sort().map((f) => ` - ${f}`).join('\n') +
      '\n\n' +
      (legacyBranchExists
        ? 'Pre-retirement: add the file to ALLOWED_PRE_RETIREMENT in\n' +
          'scripts/audit-hvac-legacy-references.ts with a justification comment.\n' +
          'This list is a deletion tracking list, not a permanent whitelist.'
        : 'Post-retirement: zero tolerance. Remove all legacy HVAC references.')
  );
}

console.log('[audit-hvac-legacy-references] PASS\n');
