#!/usr/bin/env tsx
/**
 * verify-hvac-legacy-retirement
 *
 * Machine-enforced prerequisite check for removing the legacy_hvac renderer
 * branch from LessonContentRenderer.tsx.
 *
 * Run: pnpm verify:hvac-legacy-retirement
 *
 * All checks must pass before the legacy_hvac case may be deleted.
 * This script is wired into CI as a required job — see .github/workflows/ci-cd.yml.
 *
 * View introspection uses DATABASE_URL (direct Postgres) when available,
 * falling back to the Supabase REST API with SUPABASE_SERVICE_ROLE_KEY.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

// Load .env.local in non-CI environments
try {
  const { config } = await import('dotenv');
  config({ path: '.env.local' });
} catch {
  // dotenv optional — CI injects env vars directly
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Severity = 'FATAL' | 'FAIL';

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
  severity: Severity;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fail(message: string): never {
  console.error(`\n[verify-hvac-legacy-retirement] FATAL: ${message}\n`);
  process.exit(1);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) fail(`Missing required env var: ${name}`);
  return value!;
}

function fileExists(relPath: string): boolean {
  return fs.existsSync(path.resolve(process.cwd(), relPath));
}

function fileContains(relPath: string, needle: string): boolean {
  const full = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(full)) return false;
  return fs.readFileSync(full, 'utf8').includes(needle);
}

function check(
  name: string,
  ok: boolean,
  detail: string,
  severity: Severity = 'FAIL'
): CheckResult {
  return { name, ok, detail, severity };
}

// ── DB helpers ────────────────────────────────────────────────────────────────

/**
 * Fetch the lms_lessons view definition.
 * Prefers DATABASE_URL (direct pg) → falls back to Supabase REST pg_views query.
 */
async function getLmsLessonsViewDefinition(
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<string | null> {
  // Attempt 1: direct Postgres via DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const { default: pg } = await import('pg');
      const client = new pg.Client({ connectionString: dbUrl });
      await client.connect();
      const res = await client.query<{ definition: string }>(
        `SELECT definition FROM pg_views
         WHERE schemaname = 'public' AND viewname = 'lms_lessons'`
      );
      await client.end();
      return res.rows[0]?.definition ?? null;
    } catch (err) {
      console.warn(
        `[verify-hvac-legacy-retirement] DATABASE_URL pg query failed, falling back to REST: ${err}`
      );
    }
  }

  // Attempt 2: Supabase REST — pg_views is accessible via service role
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/pg_views?select=definition&schemaname=eq.public&viewname=eq.lms_lessons`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ definition: string }>;
    return rows[0]?.definition ?? null;
  } catch {
    return null;
  }
}

// ── HVAC course constant ──────────────────────────────────────────────────────

const HVAC_COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const results: CheckResult[] = [];

  // ── Check 1: HVAC video lessons have video_file set ────────────────────────
  {
    const { data, error } = await db
      .from('curriculum_lessons')
      .select('id, video_file, lesson_type')
      .eq('course_id', HVAC_COURSE_ID)
      .eq('lesson_type', 'video');

    if (error) {
      results.push(check(
        'hvac_video_coverage',
        false,
        `query failed: ${error.message}`,
        'FATAL'
      ));
    } else {
      const rows = data ?? [];
      const missing = rows.filter(
        (r) => !r.video_file || !String(r.video_file).trim()
      );
      results.push(check(
        'hvac_video_coverage',
        rows.length > 0 && missing.length === 0,
        `video_lessons=${rows.length}, missing_video_file=${missing.length}` +
          (missing.length > 0
            ? ` [${missing.slice(0, 3).map((r) => r.id).join(', ')}${missing.length > 3 ? '…' : ''}]`
            : '')
      ));
    }
  }

  // ── Check 2: HVAC assessment lessons have quiz_questions backfilled ─────────
  {
    const { data, error } = await db
      .from('curriculum_lessons')
      .select('id, lesson_type, quiz_questions')
      .eq('course_id', HVAC_COURSE_ID)
      .in('lesson_type', ['quiz', 'checkpoint', 'final_exam']);

    if (error) {
      results.push(check(
        'hvac_quiz_backfill',
        false,
        `query failed: ${error.message}`,
        'FATAL'
      ));
    } else {
      const rows = data ?? [];
      const incomplete = rows.filter((r) => {
        const q = r.quiz_questions;
        return !q || (Array.isArray(q) && q.length === 0);
      });
      results.push(check(
        'hvac_quiz_backfill',
        rows.length > 0 && incomplete.length === 0,
        `assessment_lessons=${rows.length}, missing_quiz_questions=${incomplete.length}` +
          (incomplete.length > 0
            ? ` [${incomplete.slice(0, 3).map((r) => r.id).join(', ')}${incomplete.length > 3 ? '…' : ''}]`
            : '')
      ));
    }
  }

  // ── Check 3: lms_lessons view sources HVAC from curriculum_lessons ──────────
  {
    // Confirm no training_lessons rows exist for this course in the view
    const { data, error } = await db
      .from('lms_lessons')
      .select('id, lesson_source')
      .eq('course_id', HVAC_COURSE_ID);

    if (error) {
      results.push(check(
        'lms_lessons_hvac_source',
        false,
        `lms_lessons query failed: ${error.message}`,
        'FATAL'
      ));
    } else {
      const rows = data ?? [];
      const legacyRows = rows.filter((r) => r.lesson_source === 'training');
      results.push(check(
        'lms_lessons_hvac_source',
        rows.length > 0 && legacyRows.length === 0,
        `total=${rows.length}, still_from_training_lessons=${legacyRows.length}`
      ));
    }
  }

  // ── Check 4: lms_lessons view definition no longer references training_lessons
  {
    const definition = await getLmsLessonsViewDefinition(supabaseUrl, serviceRoleKey);

    if (definition === null) {
      results.push(check(
        'lms_lessons_view_definition',
        false,
        'could not retrieve view definition — verify DATABASE_URL or REST access',
        'FATAL'
      ));
    } else {
      const refsTraining = definition.includes('training_lessons');
      const refsCurriculum = definition.includes('curriculum_lessons');
      results.push(check(
        'lms_lessons_view_definition',
        !refsTraining && refsCurriculum,
        refsTraining
          ? 'view still references training_lessons — update lms_lessons view first'
          : !refsCurriculum
          ? 'view does not reference curriculum_lessons — unexpected definition'
          : 'view references curriculum_lessons only'
      ));
    }
  }

  // ── Check 5: Simulation keys migrated to content_structured ────────────────
  {
    const { data, error } = await db
      .from('curriculum_lessons')
      .select('id, simulation_key')
      .eq('course_id', HVAC_COURSE_ID)
      .not('simulation_key', 'is', null);

    if (error) {
      // simulation_key column may not exist yet — treat as non-fatal warning
      results.push(check(
        'hvac_simulation_key_migration',
        false,
        `query failed (column may not exist yet): ${error.message}`,
        'FAIL'
      ));
    } else {
      const rows = data ?? [];
      const invalid = rows.filter(
        (r) =>
          String(r.simulation_key).startsWith('legacy_') ||
          String(r.simulation_key).includes('training_lessons')
      );
      results.push(check(
        'hvac_simulation_key_migration',
        invalid.length === 0,
        `rows_with_simulation_key=${rows.length}, invalid_legacy_keys=${invalid.length}`
      ));
    }
  }

  // ── Check 6: legacy_hvac renderer branch still present (expected until cutover)
  results.push(check(
    'renderer_legacy_branch_present',
    fileContains('components/lms/LessonContentRenderer.tsx', "case 'legacy_hvac'"),
    fileContains('components/lms/LessonContentRenderer.tsx', "case 'legacy_hvac'")
      ? 'legacy_hvac case present in renderer (expected)'
      : 'legacy_hvac case MISSING from renderer — was it deleted before prerequisites passed?',
    'FATAL'
  ));

  // ── Check 7: retirement stub migration exists ───────────────────────────────
  results.push(check(
    'retirement_stub_migration_present',
    fileExists('supabase/migrations/20270101000001_drop_legacy_hvac_content_path.sql'),
    fileExists('supabase/migrations/20270101000001_drop_legacy_hvac_content_path.sql')
      ? 'present'
      : 'missing — was it accidentally deleted?'
  ));

  // ── Check 8: tracked legacy files present (must be deleted atomically) ──────
  const trackedLegacyFiles = [
    'lib/legacy-hvac/getLegacyHvacContent.ts',
    'lib/legacy-hvac/mapTrainingLessonToLms.ts',
    'lib/legacy-hvac/resolveLegacyHvacSimulation.ts',
  ];

  for (const relPath of trackedLegacyFiles) {
    results.push(check(
      `tracked_legacy_file_present:${relPath}`,
      fileExists(relPath),
      fileExists(relPath) ? 'present' : 'missing — delete only in the retirement PR'
    ));
  }

  // ── Check 9: kill switch is still enabled ──────────────────────────────────
  results.push(check(
    'kill_switch_enabled',
    fileContains('lib/flags/hvacLegacyRetirement.ts', 'HVAC_LEGACY_RUNTIME_ALLOWED = true'),
    fileContains('lib/flags/hvacLegacyRetirement.ts', 'HVAC_LEGACY_RUNTIME_ALLOWED = true')
      ? 'HVAC_LEGACY_RUNTIME_ALLOWED=true (expected until cutover)'
      : 'HVAC_LEGACY_RUNTIME_ALLOWED is not true — flip only after all other checks pass'
  ));

  // ── Report ─────────────────────────────────────────────────────────────────
  console.log('\n[verify-hvac-legacy-retirement] Results:\n');

  let failed = 0;
  for (const r of results) {
    const tag = r.ok ? '  PASS' : `  ${r.severity}`;
    console.log(`${tag}  ${r.name}`);
    console.log(`        ${r.detail}`);
    if (!r.ok) failed++;
  }

  console.log('');

  if (failed > 0) {
    fail(
      `${failed} check(s) failed. Do not remove legacy_hvac until all checks pass.\n` +
        `  Run: pnpm verify:hvac-legacy-retirement\n` +
        `  Docs: docs/hvac-legacy-retirement-checklist.md`
    );
  }

  console.log(
    '[verify-hvac-legacy-retirement] All prerequisites satisfied.\n' +
      'It is safe to prepare the legacy_hvac retirement PR.\n' +
      'Follow docs/hvac-legacy-retirement-checklist.md for the deletion sequence.'
  );
}

main().catch((err) => {
  fail(err instanceof Error ? (err.stack ?? err.message) : String(err));
});
