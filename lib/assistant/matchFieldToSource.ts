/**
 * Rule-based field matcher.
 * Maps a field label to the correct org profile key.
 * Deterministic — no AI. Add patterns as new forms are encountered.
 */

import { ORG_PROFILE, matchField } from '@/lib/grants/org-profile';

export type SuggestedAnswer = {
  fieldName: string;
  fieldLabel: string;
  suggestion: string;
  alternatives?: string[];
  sourceKey: string;
  sourceType: 'profile' | 'narrative' | 'prior_approved';
  confidence: number; // 0–1
};

/**
 * Generate a suggestion for a single field label.
 */
export function suggestForField(fieldName: string, fieldLabel: string): SuggestedAnswer | null {
  const match = matchField(fieldLabel);
  if (!match) return null;

  return {
    fieldName,
    fieldLabel,
    suggestion: match.value,
    alternatives: match.alternatives,
    sourceKey: fieldName,
    sourceType: 'profile',
    confidence: match.confidence === 'high' ? 0.95 : match.confidence === 'medium' ? 0.75 : 0.5,
  };
}

/**
 * Generate suggestions for all fields in a form schema.
 */
export function generateSuggestions(
  fields: Array<{ fieldName: string; fieldLabel: string }>
): SuggestedAnswer[] {
  return fields
    .map((f) => suggestForField(f.fieldName, f.fieldLabel))
    .filter((s): s is SuggestedAnswer => s !== null);
}

export { ORG_PROFILE };
