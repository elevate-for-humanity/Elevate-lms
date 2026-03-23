/**
 * hvac-legacy-retirement-guard
 *
 * Guards against accidental deletion of the legacy_hvac renderer branch,
 * the kill switch, the retirement stub, and the checklist before the
 * machine verifier (`pnpm verify:hvac-legacy`) has been run and passed.
 *
 * These tests are intentionally simple — they catch dumb mistakes before
 * the deeper CI verifier even runs.
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.resolve(root, rel), 'utf8');
const exists = (rel: string) => fs.existsSync(path.resolve(root, rel));

describe('HVAC legacy retirement guard', () => {
  // ── Renderer ──────────────────────────────────────────────────────────────

  it("keeps the legacy_hvac case in LessonContentRenderer until retirement", () => {
    const text = read('components/lms/LessonContentRenderer.tsx');
    expect(text).toContain("case 'legacy_hvac'");
  });

  it("keeps the 2027-Q1 retirement target comment in LessonContentRenderer", () => {
    const text = read('components/lms/LessonContentRenderer.tsx');
    expect(text).toContain('2027-Q1');
  });

  it("imports the kill switch in LessonContentRenderer", () => {
    const text = read('components/lms/LessonContentRenderer.tsx');
    expect(text).toContain('HVAC_LEGACY_RUNTIME_ALLOWED');
    expect(text).toContain('hvacLegacyRetirement');
  });

  it("throws when kill switch is disabled (kill switch guard is present)", () => {
    const text = read('components/lms/LessonContentRenderer.tsx');
    expect(text).toContain('if (!HVAC_LEGACY_RUNTIME_ALLOWED)');
    expect(text).toContain('legacy_hvac runtime path is disabled');
  });

  // ── Kill switch ───────────────────────────────────────────────────────────

  it("keeps the kill switch file present", () => {
    expect(exists('lib/flags/hvacLegacyRetirement.ts')).toBe(true);
  });

  it("keeps HVAC_LEGACY_RUNTIME_ALLOWED = true until cutover", () => {
    const text = read('lib/flags/hvacLegacyRetirement.ts');
    expect(text).toContain('HVAC_LEGACY_RUNTIME_ALLOWED = true');
  });

  it("exports HVAC_LEGACY_RETIREMENT_TARGET as 2027-Q1", () => {
    const text = read('lib/flags/hvacLegacyRetirement.ts');
    expect(text).toContain("HVAC_LEGACY_RETIREMENT_TARGET = '2027-Q1'");
  });

  // ── Tracked legacy files ──────────────────────────────────────────────────

  it("keeps lib/legacy-hvac/getLegacyHvacContent.ts present", () => {
    expect(exists('lib/legacy-hvac/getLegacyHvacContent.ts')).toBe(true);
  });

  it("keeps lib/legacy-hvac/mapTrainingLessonToLms.ts present", () => {
    expect(exists('lib/legacy-hvac/mapTrainingLessonToLms.ts')).toBe(true);
  });

  it("keeps lib/legacy-hvac/resolveLegacyHvacSimulation.ts present", () => {
    expect(exists('lib/legacy-hvac/resolveLegacyHvacSimulation.ts')).toBe(true);
  });

  // ── Retirement infrastructure ─────────────────────────────────────────────

  it("keeps the merge policy document present", () => {
    expect(exists('docs/hvac-legacy-retirement-merge-policy.md')).toBe(true);
  });

  it("keeps the retirement stub migration present", () => {
    expect(
      exists('supabase/migrations/20270101000001_drop_legacy_hvac_content_path.sql')
    ).toBe(true);
  });

  it("keeps the retirement checklist present", () => {
    expect(exists('docs/hvac-legacy-retirement-checklist.md')).toBe(true);
  });

  it("keeps the verifier script present", () => {
    expect(exists('scripts/verify-hvac-legacy-retirement.ts')).toBe(true);
  });

  it("keeps the removal state enforcer script present", () => {
    expect(exists('scripts/enforce-hvac-legacy-removal-state.ts')).toBe(true);
  });

  // ── package.json scripts ──────────────────────────────────────────────────

  // ── Additional scripts ────────────────────────────────────────────────────

  it("has audit-hvac-legacy-references.ts present", () => {
    expect(exists('scripts/audit-hvac-legacy-references.ts')).toBe(true);
  });

  it("has hvac-legacy-readiness.ts present", () => {
    expect(exists('scripts/hvac-legacy-readiness.ts')).toBe(true);
  });

  // ── Cutover test ──────────────────────────────────────────────────────────

  it("has hvac-legacy-kill-switch-cutover.test.ts present", () => {
    expect(exists('tests/unit/hvac-legacy-kill-switch-cutover.test.ts')).toBe(true);
  });

  // ── CI workflow ───────────────────────────────────────────────────────────

  it("has all four HVAC legacy enforcement steps in ci-cd.yml", () => {
    const text = read('.github/workflows/ci-cd.yml');
    expect(text).toContain('enforce-hvac-legacy-removal-state.ts');
    expect(text).toContain('audit-hvac-legacy-references.ts');
    expect(text).toContain('verify-hvac-legacy-retirement.ts');
    expect(text).toContain('hvac-legacy-readiness.ts');
  });

  // ── package.json scripts ──────────────────────────────────────────────────

  it("has all six HVAC legacy scripts in package.json", () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    expect(pkg.scripts['verify:hvac-legacy-retirement']).toBeDefined();
    expect(pkg.scripts['verify:hvac-legacy-removal-state']).toBeDefined();
    expect(pkg.scripts['verify:hvac-legacy']).toBeDefined();
    expect(pkg.scripts['audit:hvac-legacy-refs']).toBeDefined();
    expect(pkg.scripts['verify:hvac-legacy-readiness']).toBeDefined();
  });
});
