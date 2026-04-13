/**
 * lib/course-builder/competencies.ts
 *
 * Canonical competency registry.
 *
 * Every competency key used in any blueprint must be registered here.
 * The validator rejects any lesson whose competencyChecks reference an
 * unregistered key — preventing slug drift between blueprints, the DB,
 * and the instructor sign-off UI.
 *
 * To add a new program's competencies:
 *   1. Add entries to COMPETENCY_REGISTRY below.
 *   2. Reference those keys in the blueprint's competencyChecks arrays.
 *   3. The validator will enforce them automatically.
 */

import type { AssessmentMethod } from './schema';

export type CompetencyDefinition = {
  /** Stable machine key — must match course_lessons.competency_checks[].key in DB */
  key: string;
  /** Human-readable label shown in instructor sign-off UI */
  label: string;
  /** Program slug this competency belongs to */
  programSlug: string;
  /** Whether this competency requires instructor sign-off to unlock lesson completion */
  requiresInstructorSignoff: boolean;
  /** Whether failure on this competency is a program disqualifier */
  isCritical: boolean;
  /** How this competency is assessed — drives mapper and gate logic */
  assessmentMethod: AssessmentMethod;
  /** Domain key for state board / credential alignment */
  domainKey?: string;
  /** Optional description for instructor guidance */
  description?: string;
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const COMPETENCY_REGISTRY: CompetencyDefinition[] = [
  // ── Barber Apprenticeship — Lesson 4: Infection Control & Sanitation ────────
  {
    key: 'barbicide_immersion',
    label: 'Barbicide Immersion Procedure',
    programSlug: 'barber-apprenticeship',
    requiresInstructorSignoff: true,
    isCritical: true,
    assessmentMethod: 'observation',
    domainKey: 'infection_control',
    description: 'Student correctly prepares Barbicide solution and fully submerges tools for required contact time.',
  },
  {
    key: 'razor_blade_change',
    label: 'Razor Blade Change',
    programSlug: 'barber-apprenticeship',
    requiresInstructorSignoff: true,
    isCritical: true,
    assessmentMethod: 'observation',
    domainKey: 'infection_control',
    description: 'Student safely removes and replaces a razor blade using proper sharps handling technique.',
  },
  {
    key: 'neck_strip_application',
    label: 'Neck Strip Application',
    programSlug: 'barber-apprenticeship',
    requiresInstructorSignoff: true,
    isCritical: false,
    assessmentMethod: 'observation',
    domainKey: 'infection_control',
    description: 'Student applies neck strip and cape without skin contact, ensuring client protection.',
  },

  // ── Barber Apprenticeship — Lesson 5: Chemical Safety & OSHA ───────────────
  {
    key: 'chemical_storage',
    label: 'Chemical Storage Compliance',
    programSlug: 'barber-apprenticeship',
    requiresInstructorSignoff: true,
    isCritical: true,
    assessmentMethod: 'observation',
    domainKey: 'chemical_services',
    description: 'Student correctly labels, stores, and segregates chemicals per OSHA HazCom standards.',
  },
  {
    key: 'hazard_identification',
    label: 'Hazard Identification (SDS)',
    programSlug: 'barber-apprenticeship',
    requiresInstructorSignoff: true,
    isCritical: false,
    assessmentMethod: 'observation',
    domainKey: 'chemical_services',
    description: 'Student locates and reads a Safety Data Sheet, identifying hazard class and PPE requirements.',
  },

  // ── Barber Apprenticeship — Lesson 6: Client Consultation ──────────────────
  {
    key: 'consultation_live',
    label: 'Live Client Consultation',
    programSlug: 'barber-apprenticeship',
    requiresInstructorSignoff: true,
    isCritical: true,
    assessmentMethod: 'observation',
    domainKey: 'consultation',
    description: 'Student conducts a full consultation: service goals, contraindications, and written record.',
  },

  // ── Barber Apprenticeship — Lesson 15: Clipper & Trimmer Maintenance ────────
  {
    key: 'clipper_maintenance',
    label: 'Clipper Maintenance Procedure',
    programSlug: 'barber-apprenticeship',
    requiresInstructorSignoff: true,
    isCritical: false,
    assessmentMethod: 'observation',
    domainKey: 'haircutting',
    description: 'Student cleans, oils, and aligns clipper blades to manufacturer specification.',
  },

  // ── Barber Apprenticeship — Lesson 17: Straight Razor & Shaving ─────────────
  {
    key: 'straight_razor_grip',
    label: 'Straight Razor Grip & Stroke',
    programSlug: 'barber-apprenticeship',
    requiresInstructorSignoff: true,
    isCritical: true,
    assessmentMethod: 'observation',
    domainKey: 'shaving',
    description: 'Student demonstrates correct razor grip, tension, and stroke angle on a mannequin.',
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/** All registered keys as a Set — O(1) lookup */
const REGISTERED_KEYS = new Set(COMPETENCY_REGISTRY.map(c => c.key));

/** Map from key → definition */
const REGISTRY_MAP = new Map(COMPETENCY_REGISTRY.map(c => [c.key, c]));

/** Returns true if the key exists in the registry */
export function isRegisteredCompetencyKey(key: string): boolean {
  return REGISTERED_KEYS.has(key);
}

/** Returns the definition for a key, or undefined if not registered */
export function getCompetencyDefinition(key: string): CompetencyDefinition | undefined {
  return REGISTRY_MAP.get(key);
}

/** Returns all competency keys for a given program slug */
export function getCompetenciesForProgram(programSlug: string): CompetencyDefinition[] {
  return COMPETENCY_REGISTRY.filter(c => c.programSlug === programSlug);
}

/** Validates a list of keys — returns any that are not registered */
export function findUnregisteredKeys(keys: string[]): string[] {
  return keys.filter(k => !REGISTERED_KEYS.has(k));
}
