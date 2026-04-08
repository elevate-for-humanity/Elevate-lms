/**
 * Types for ServSafe and AHLEI hospitality certification programs.
 *
 * ServSafe is administered by the National Restaurant Association (NRA).
 * Elevate sells course+exam bundles — this is NOT a proctored testing center
 * offering. NRA handles exam delivery directly.
 *
 * AHLEI programs (Guest Service Gold, START, ServSuccess) are administered
 * by the American Hotel & Lodging Educational Institute.
 */

export type ServsafePriceType =
  | 'course_exam_bundle'
  | 'exam_only'
  | 'retake'
  | 'instructor_material'
  | 'learning_suite';

export interface ServsafeProduct {
  key:             string;
  label:           string;
  /** Vendor cost — admin only, never rendered publicly */
  vendorBase:      number;
  type:            ServsafePriceType;
  /** Explicit retail price — use when formula deviates from agreed target */
  retailOverride?: number;
  description?:    string;
}

export interface ServsafeProgram {
  key:              string;
  label:            string;
  category:         'servsafe' | 'ahlei';
  shortDescription: string;
  products:         ServsafeProduct[];
  featured?:        boolean;
}
