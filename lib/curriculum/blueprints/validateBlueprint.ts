/**
 * lib/curriculum/blueprints/validateBlueprint.ts
 *
 * Validates a CredentialBlueprint at runtime.
 * Throws on any structural violation — never warns silently.
 */

import type { CredentialBlueprint } from './types';

export function validateBlueprint(blueprint: CredentialBlueprint): void {
  if (!blueprint.id)             throw new Error('Blueprint missing id');
  if (!blueprint.credentialSlug) throw new Error('Blueprint missing credentialSlug');
  if (!blueprint.credentialTitle)throw new Error('Blueprint missing credentialTitle');
  if (!blueprint.state)          throw new Error('Blueprint missing state');
  if (!blueprint.programSlug)    throw new Error('Blueprint missing programSlug');
  if (!blueprint.credentialCode) throw new Error('Blueprint missing credentialCode');
  if (!blueprint.version)        throw new Error('Blueprint missing version');
  if (!blueprint.status)         throw new Error('Blueprint missing status');

  if (!blueprint.generationRules) {
    throw new Error(`Blueprint "${blueprint.id}" missing generationRules`);
  }

  if (!Array.isArray(blueprint.assessmentRules) || blueprint.assessmentRules.length === 0) {
    throw new Error(`Blueprint "${blueprint.id}" missing assessmentRules`);
  }

  if (blueprint.modules.length !== blueprint.expectedModuleCount) {
    throw new Error(
      `Blueprint "${blueprint.id}": expected ${blueprint.expectedModuleCount} modules, found ${blueprint.modules.length}`
    );
  }

  const moduleSlugs  = new Set<string>();
  const lessonSlugs  = new Set<string>();
  let   lessonCount  = 0;

  for (const mod of blueprint.modules) {
    if (!mod.slug)  throw new Error(`Blueprint "${blueprint.id}" has module with missing slug`);
    if (!mod.title) throw new Error(`Blueprint "${blueprint.id}" has module with missing title`);

    if (moduleSlugs.has(mod.slug)) {
      throw new Error(`Blueprint "${blueprint.id}" has duplicate module slug: "${mod.slug}"`);
    }
    moduleSlugs.add(mod.slug);

    if (mod.orderIndex == null || mod.orderIndex < 1) {
      throw new Error(`Blueprint "${blueprint.id}" module "${mod.slug}" has invalid orderIndex`);
    }

    if (mod.minLessons == null || mod.maxLessons == null || mod.minLessons > mod.maxLessons) {
      throw new Error(
        `Blueprint "${blueprint.id}" module "${mod.slug}" has invalid lesson bounds (min=${mod.minLessons}, max=${mod.maxLessons})`
      );
    }

    // Validate pre-defined lesson list if present
    if (mod.lessons) {
      const seenOrders = new Set<number>();
      for (const lesson of mod.lessons) {
        lessonCount++;

        if (!lesson.slug) {
          throw new Error(
            `Blueprint "${blueprint.id}" module "${mod.slug}" has lesson with missing slug`
          );
        }
        if (lessonSlugs.has(lesson.slug)) {
          throw new Error(
            `Blueprint "${blueprint.id}" has duplicate lesson slug: "${lesson.slug}"`
          );
        }
        lessonSlugs.add(lesson.slug);

        if (seenOrders.has(lesson.order)) {
          throw new Error(
            `Blueprint "${blueprint.id}" module "${mod.slug}" has duplicate lesson order: ${lesson.order}`
          );
        }
        seenOrders.add(lesson.order);
      }
    }
  }

  // Only enforce expectedLessonCount when lessons are pre-defined (> 0)
  if (blueprint.expectedLessonCount > 0 && lessonCount !== blueprint.expectedLessonCount) {
    throw new Error(
      `Blueprint "${blueprint.id}": expected ${blueprint.expectedLessonCount} lessons, found ${lessonCount}`
    );
  }
}
