/**
 * lib/curriculum/blueprints/types.ts
 *
 * Canonical types for the credential blueprint system.
 * Slugs are the durable identity. Titles are display text.
 * The builder uses slugs only — never title matching.
 */

export type BlueprintLessonRef = {
  slug: string;
  title: string;
  order: number;
  domainKey: string;
  competencyKeys?: string[];
};

export type BlueprintModule = {
  key: string;
  title: string;
  order: number;
  domainKey: string;
  lessons: BlueprintLessonRef[];
};

export type CredentialBlueprint = {
  id: string;
  version: string;
  credentialSlug: string;
  credentialTitle: string;
  state: string;
  expectedModuleCount: number;
  expectedLessonCount: number;
  modules: BlueprintModule[];
};
