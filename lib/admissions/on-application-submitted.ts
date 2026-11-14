import type { SupabaseClient } from '@supabase/supabase-js';

export type BinderDocumentRequirement = { documentType: string; name: string };

export const BASE_BINDER_DOCUMENTS: readonly BinderDocumentRequirement[] = [
  { documentType: 'government_id', name: 'Government-issued photo ID' },
  { documentType: 'ssn_card', name: 'Social Security card' },
  { documentType: 'hs_diploma_or_ged', name: 'High school diploma or GED' },
  { documentType: 'resume', name: 'Resume' },
  { documentType: 'income_verification', name: 'Income verification' },
  { documentType: 'proof_of_residency', name: 'Proof of residency' },
];

export const CLINICAL_BINDER_DOCUMENTS: readonly BinderDocumentRequirement[] = [
  { documentType: 'cpr_card', name: 'CPR card' },
  { documentType: 'immunizations', name: 'Immunization records' },
  { documentType: 'physical', name: 'Physical exam' },
  { documentType: 'background_check', name: 'Background check' },
  { documentType: 'drug_screen', name: 'Drug screen' },
];

const CLINICAL_PROGRAM_PATTERN =
  /apprentice|barber|cosmetolog|esthetic|manicur|nail|health|medical|nurs|cna|phleb|ekg|pharm|patient|dental|clinical|caregiver|home-health|peer-recovery/;

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function requiresClinicalDocuments(programSlug: string | null | undefined): boolean {
  return Boolean(programSlug && CLINICAL_PROGRAM_PATTERN.test(programSlug.toLowerCase()));
}

export function binderChecklistFor(programSlug: string | null | undefined): BinderDocumentRequirement[] {
  return requiresClinicalDocuments(programSlug)
    ? [...BASE_BINDER_DOCUMENTS, ...CLINICAL_BINDER_DOCUMENTS]
    : [...BASE_BINDER_DOCUMENTS];
}

export async function ensureApplicationBinderChecklist(db: SupabaseClient, programSlug: string | null | undefined) {
  if (!programSlug) return [];
  const { data: configured, error: lookupError } = await db.from('apprentice_document_types')
    .select('document_type').eq('program_slug', programSlug);
  if (lookupError) throw lookupError;
  // A program with a configured checklist keeps it: adding default keys
  // alongside existing aliases (e.g. social_security_card) would reopen
  // binders whose approved uploads match the configured key.
  if (configured && configured.length > 0) return configured.map((row) => row.document_type as string);
  const checklist = binderChecklistFor(programSlug);
  const { error } = await db.from('apprentice_document_types').upsert(
    checklist.map((doc, index) => ({
      program_slug: programSlug,
      document_type: doc.documentType,
      name: doc.name,
      is_required: true,
      display_order: index,
    })),
    { onConflict: 'program_slug,document_type', ignoreDuplicates: true },
  );
  if (error) throw error;
  return checklist.map((doc) => doc.documentType);
}
