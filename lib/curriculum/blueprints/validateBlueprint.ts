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
  if (!blueprint.state)          throw new Error('Blueprint missing state');
  if (!blueprint.version)        throw new Error('Blueprint missing version');

  if (blueprint.modules.length !== blueprint.expectedModuleCount) {
    throw new Error(
      `Blueprint "${blueprint.id}": expected ${blueprint.expectedModuleCount} modules, found ${blueprint.modules.length}`
    );
  }

  const moduleKeys   = new Set<string>();
  const lessonSlugs  = new Set<string>();
  let   lessonCount  = 0;

  for (const mod of blueprint.modules) {
    if (!mod.key)   throw new Error(`Blueprint "${blueprint.id}" has module with missing key`);
    if (!mod.title) throw new Error(`Blueprint "${blueprint.id}" has module with missing title`);

    if (moduleKeys.has(mod.key)) {
      throw new Error(`Blueprint "${blueprint.id}" has duplicate module key: "${mod.key}"`);
    }
    moduleKeys.add(mod.key);

    const seenOrders = new Set<number>();

    for (const lesson of mod.lessons) {
      lessonCount++;

      if (!lesson.slug) {
        throw new Error(
          `Blueprint "${blueprint.id}" module "${mod.key}" has lesson with missing slug`
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
          `Blueprint "${blueprint.id}" module "${mod.key}" has duplicate lesson order: ${lesson.order}`
        );
      }
      seenOrders.add(lesson.order);
    }
  }

  if (lessonCount !== blueprint.expectedLessonCount) {
    throw new Error(
      `Blueprint "${blueprint.id}": expected ${blueprint.expectedLessonCount} lessons, found ${lessonCount}`
    );
  }
}
