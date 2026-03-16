/**
 * lib/curriculum/blueprints/auditor.ts
 *
 * Validates a generated lesson batch against a credential blueprint.
 *
 * This replaces generic heuristic checks with authoritative blueprint rules.
 * A generation fails if any required module, lesson type, competency, or
 * assessment is missing. Warnings are non-blocking but logged.
 *
 * Usage:
 *   import { auditAgainstBlueprint } from '@/lib/curriculum/blueprints/auditor';
 *   const result = auditAgainstBlueprint(blueprint, generatedLessons);
 *   if (!result.passed) throw new Error(result.violations.map(v => v.detail).join('\n'));
 */

import type { CredentialBlueprint, BlueprintModule, BlueprintAuditResult, BlueprintAuditViolation } from './types';
import type { LessonContract } from '../types';

// ─── Main audit entry point ───────────────────────────────────────────────────

export function auditAgainstBlueprint(
  blueprint: CredentialBlueprint,
  lessons: LessonContract[],
): BlueprintAuditResult {
  const violations: BlueprintAuditViolation[] = [];
  const warnings:   BlueprintAuditViolation[] = [];

  // Group lessons by module_title for lookup
  const byModule = groupByModule(lessons);

  // 1. Check every required module exists
  const generatedModuleTitles = new Set(lessons.map(l => l.module_title));
  for (const bpMod of blueprint.modules) {
    if (!generatedModuleTitles.has(bpMod.title)) {
      violations.push({
        severity: 'error',
        moduleSlug: bpMod.slug,
        rule: 'required_module_missing',
        detail: `Module "${bpMod.title}" (order ${bpMod.orderIndex}) is required but was not generated.`,
      });
      continue; // skip per-module checks if module is absent
    }

    const moduleLessons = byModule.get(bpMod.title) ?? [];
    auditModule(bpMod, moduleLessons, violations, warnings);
  }

  // 2. Check module order is correct
  const orderedModules = [...blueprint.modules].sort((a, b) => a.orderIndex - b.orderIndex);
  const generatedOrder = getGeneratedModuleOrder(lessons);
  for (let i = 0; i < orderedModules.length; i++) {
    const expected = orderedModules[i].title;
    const actual   = generatedOrder[i];
    if (actual && actual !== expected) {
      violations.push({
        severity: 'error',
        moduleSlug: orderedModules[i].slug,
        rule: 'module_order_wrong',
        detail: `Module order mismatch at position ${i + 1}: expected "${expected}", got "${actual}".`,
      });
    }
  }

  // 3. Check total lesson count does not exceed max
  const { maxTotalLessons } = blueprint.generationRules;
  if (lessons.length > maxTotalLessons) {
    warnings.push({
      severity: 'warning',
      rule: 'total_lessons_exceeded',
      detail: `Generated ${lessons.length} lessons but blueprint max is ${maxTotalLessons}.`,
    });
  }

  // 4. Check final exam exists if required
  if (blueprint.generationRules.requiresFinalExam) {
    const hasFinalExam = lessons.some(l =>
      (l as any).lesson_type === 'final_exam' ||
      l.lesson_title.toLowerCase().includes('final') ||
      l.lesson_title.toLowerCase().includes('practice exam')
    );
    if (!hasFinalExam) {
      violations.push({
        severity: 'error',
        rule: 'final_exam_missing',
        detail: 'Blueprint requires a final exam but none was found in generated lessons.',
      });
    }
  }

  return {
    blueprintSlug: blueprint.slug,
    passed: violations.length === 0,
    violations,
    warnings,
  };
}

// ─── Per-module audit ─────────────────────────────────────────────────────────

function auditModule(
  bpMod: BlueprintModule,
  lessons: LessonContract[],
  violations: BlueprintAuditViolation[],
  warnings: BlueprintAuditViolation[],
): void {
  const count = lessons.length;

  // Lesson count bounds
  if (count < bpMod.minLessons) {
    violations.push({
      severity: 'error',
      moduleSlug: bpMod.slug,
      rule: 'lesson_count_below_minimum',
      detail: `Module "${bpMod.title}" has ${count} lessons but requires at least ${bpMod.minLessons}.`,
    });
  }
  if (count > bpMod.maxLessons) {
    warnings.push({
      severity: 'warning',
      moduleSlug: bpMod.slug,
      rule: 'lesson_count_above_maximum',
      detail: `Module "${bpMod.title}" has ${count} lessons but blueprint max is ${bpMod.maxLessons}.`,
    });
  }

  // Required lesson types
  for (const typeRule of bpMod.requiredLessonTypes) {
    const typeCount = lessons.filter(l =>
      (l as any).lesson_type === typeRule.lessonType ||
      inferLessonType(l) === typeRule.lessonType
    ).length;
    if (typeCount < typeRule.requiredCount) {
      violations.push({
        severity: 'error',
        moduleSlug: bpMod.slug,
        rule: 'required_lesson_type_missing',
        detail: `Module "${bpMod.title}" requires ${typeRule.requiredCount} "${typeRule.lessonType}" lesson(s) but has ${typeCount}.`,
      });
    }
  }

  // Quiz required
  if (bpMod.quizRequired) {
    const hasQuiz = lessons.some(l =>
      (l as any).lesson_type === 'quiz' ||
      l.lesson_title.toLowerCase().includes('quiz') ||
      l.lesson_title.toLowerCase().includes('checkpoint')
    );
    if (!hasQuiz) {
      violations.push({
        severity: 'error',
        moduleSlug: bpMod.slug,
        rule: 'quiz_missing',
        detail: `Module "${bpMod.title}" requires a quiz but none was found.`,
      });
    }
  }

  // Competency coverage
  const allCompetencyKeys = lessons.flatMap(l => l.competency_keys ?? []);
  for (const comp of bpMod.competencies) {
    const touchpoints = allCompetencyKeys.filter(k => k === comp.competencyKey).length;
    if (touchpoints < comp.minimumTouchpoints) {
      const severity = comp.isCritical ? 'error' : 'warning';
      (severity === 'error' ? violations : warnings).push({
        severity,
        moduleSlug: bpMod.slug,
        rule: 'competency_undercovered',
        detail: `Module "${bpMod.title}" competency "${comp.competencyKey}" needs ${comp.minimumTouchpoints} touchpoint(s) but has ${touchpoints}.`,
      });
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByModule(lessons: LessonContract[]): Map<string, LessonContract[]> {
  const map = new Map<string, LessonContract[]>();
  for (const l of lessons) {
    const key = l.module_title;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(l);
  }
  return map;
}

function getGeneratedModuleOrder(lessons: LessonContract[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  const sorted = [...lessons].sort((a, b) => a.module_order - b.module_order || a.lesson_order - b.lesson_order);
  for (const l of sorted) {
    if (!seen.has(l.module_title)) {
      seen.add(l.module_title);
      order.push(l.module_title);
    }
  }
  return order;
}

/** Infer lesson type from title when explicit type is not stored on LessonContract */
function inferLessonType(lesson: LessonContract): string {
  const t = lesson.lesson_title.toLowerCase();
  if (t.includes('quiz') || t.includes('checkpoint'))  return 'quiz';
  if (t.includes('final exam') || t.includes('practice exam')) return 'final_exam';
  if (t.includes('lab') || t.includes('practice'))     return 'lab';
  if (t.includes('practicum'))                          return 'practicum';
  if (t.includes('remediation'))                        return 'remediation';
  if (t.includes('review') || t.includes('overview'))  return 'review';
  if (t.includes('safety') || t.includes('hazard'))    return 'safety';
  if (t.includes('regulation') || t.includes('compliance') || t.includes('legal')) return 'regulation';
  if (t.includes('procedure') || t.includes('how to') || t.includes('steps')) return 'procedure';
  if (t.includes('scenario') || t.includes('case study')) return 'scenario';
  if (t.includes('introduction') || t.includes('orientation') || t.includes('welcome')) return 'orientation';
  return 'concept';
}
