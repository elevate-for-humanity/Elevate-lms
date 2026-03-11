/**
 * Maps HVAC lesson IDs to their EPA 608 certification tags.
 * Used by the dynamic lesson template to render EPA content blocks
 * and tag lessons in the LMS navigation.
 *
 * Source: EPA Section 608 spec provided in implementation package.
 *   Core    — ozone regulations, refrigerant handling, recovery requirements
 *   Type I  — small appliances, factory-sealed, ≤5 lbs refrigerant
 *   Type II — high-pressure systems: R-22, R-410A, residential/commercial
 *   Type III — low-pressure chillers: R-11, R-123, centrifugal systems
 *   Universal — all four sections passed
 */

export type Epa608Tag = 'Core' | 'Type I' | 'Type II' | 'Type III' | 'Universal';

export const EPA_608_LESSON_TAGS: Record<string, Epa608Tag[]> = {
  // ── Module 6: EPA 608 Core ────────────────────────────────────────────────
  'hvac-06-01': ['Core'],           // Ozone depletion and Clean Air Act regulations
  'hvac-06-02': ['Core'],           // Refrigerant properties and GWP/ODP
  'hvac-06-03': ['Core'],           // Recovery, recycling, and reclaim requirements
  'hvac-06-04': ['Core'],           // Leak detection and repair requirements
  'hvac-06-05': ['Core'],           // Core exam practice
  'hvac-06-06': ['Core'],           // Recovery equipment certification
  'hvac-06-07': ['Core'],           // Refrigerant sales restrictions
  'hvac-06-08': ['Core'],           // Core practice exam (25 questions)

  // ── Module 7: EPA 608 Type I — Small Appliances ───────────────────────────
  'hvac-07-01': ['Type I'],         // Small appliance scope: ≤5 lbs, factory-sealed
  'hvac-07-02': ['Type I'],         // Recovery requirements for small appliances
  'hvac-07-03': ['Type I'],         // Service procedures: piercing valves, ports
  'hvac-07-04': ['Type I'],         // Type I exam practice
  'hvac-07-05': ['Type I'],         // Type I practice exam (25 questions)

  // ── Module 8: EPA 608 Type II — High-Pressure Systems ────────────────────
  'hvac-08-01': ['Type II'],        // High-pressure system scope: R-22, R-410A
  'hvac-08-02': ['Type II'],        // Evacuation procedures for high-pressure systems
  'hvac-08-03': ['Type II'],        // Charging methods: superheat and subcooling
  'hvac-08-04': ['Type II'],        // Leak repair requirements
  'hvac-08-05': ['Type II'],        // Type II exam practice
  'hvac-08-06': ['Type II'],        // Recovery methods for high-pressure systems
  'hvac-08-07': ['Type II'],        // Type II practice exam (25 questions)

  // ── Module 9: EPA 608 Type III — Low-Pressure Systems ────────────────────
  'hvac-09-01': ['Type III'],       // Low-pressure chiller scope: R-11, R-123
  'hvac-09-02': ['Type III'],       // Purge units and vacuum conditions
  'hvac-09-03': ['Type III'],       // Recovery procedures for low-pressure systems
  'hvac-09-04': ['Type III'],       // Water contamination in chillers
  'hvac-09-05': ['Type III'],       // Type III exam practice
  'hvac-09-06': ['Type III'],       // Type III practice exam (25 questions)

  // ── Module 10: Universal Exam Prep ───────────────────────────────────────
  'hvac-10-01': ['Universal'],      // Universal certification overview
  'hvac-10-02': ['Universal'],      // Combined Core + Type I review
  'hvac-10-03': ['Universal'],      // Full-length Core practice exam
  'hvac-10-04': ['Universal'],      // Full-length Type I practice exam
  'hvac-10-05': ['Universal'],      // Full-length Type II practice exam
  'hvac-10-06': ['Universal'],      // Full-length Type III practice exam
  'hvac-10-07': ['Universal'],      // Universal combined practice exam (100 questions)

  // ── Module 16: Capstone — EPA 608 Universal exam ─────────────────────────
  'hvac-16-01': ['Universal'],      // EPA 608 Universal exam prep
  'hvac-16-02': ['Universal'],      // Proctored EPA 608 exam

  // ── Cross-module EPA references ───────────────────────────────────────────
  // Refrigeration cycle lessons reference EPA because technicians must be
  // certified before handling refrigerant in any of these systems
  'hvac-05-01': ['Core'],           // Refrigeration cycle — Core knowledge
  'hvac-05-02': ['Core'],           // Compressor function — Core
  'hvac-05-03': ['Core'],           // Condenser operation — Core
  'hvac-05-04': ['Core'],           // Metering devices — Core
  'hvac-05-05': ['Core'],           // Evaporator operation — Core
  'hvac-05-06': ['Core'],           // Superheat and subcooling — Core + Type II
};

/** Returns EPA tags for a given lesson ID */
export function getEpaTags(lessonId: string): Epa608Tag[] {
  return EPA_608_LESSON_TAGS[lessonId] ?? [];
}

/** Returns all lesson IDs tagged with a specific EPA type */
export function getLessonsByEpaType(tag: Epa608Tag): string[] {
  return Object.entries(EPA_608_LESSON_TAGS)
    .filter(([, tags]) => tags.includes(tag))
    .map(([id]) => id);
}
