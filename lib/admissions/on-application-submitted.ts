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

export type SubmittedApplication = {
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  programSlug?: string | null;
  source?: string | null;
  assignedTo?: string | null;
};

export type ApplicationAutomationResult = {
  leadId: string | null;
  leadCreated: boolean;
  binderDocuments: string[];
  taskCreated: boolean;
};

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

async function upsertLead(db: SupabaseClient, app: SubmittedApplication, email: string) {
  const { data: existing, error: lookupError } = await db
    .from('leads').select('id,status').ilike('email', escapeLikePattern(email)).limit(1).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) {
    if (existing.status === 'new') {
      const { error } = await db.from('leads')
        .update({ status: 'application_started', updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) throw error;
    }
    return { leadId: existing.id as string, leadCreated: false };
  }
  const { data: inserted, error: insertError } = await db.from('leads').insert({
    first_name: app.firstName,
    last_name: app.lastName,
    email,
    phone: app.phone || null,
    program_interest: app.programSlug || null,
    source: app.source || 'website_application',
    status: 'application_started',
    assigned_to: app.assignedTo || null,
    assigned_at: app.assignedTo ? new Date().toISOString() : null,
  }).select('id').maybeSingle();
  if (insertError) throw insertError;
  return { leadId: (inserted?.id as string | undefined) ?? null, leadCreated: true };
}

async function upsertBinderChecklist(db: SupabaseClient, programSlug: string) {
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

async function insertReviewTask(db: SupabaseClient, app: SubmittedApplication, name: string) {
  const title = `Review application from ${name}`;
  const { data: existing, error: lookupError } = await db.from('tasks').select('id')
    .eq('related_type', 'application').eq('related_id', app.applicationId).eq('title', title)
    .limit(1).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return false;
  const { error } = await db.from('tasks').insert({
    title,
    description: `New ${app.programSlug || 'program'} application from ${app.email}. Verify documents and funding.`,
    priority: 'high',
    status: 'pending',
    related_type: 'application',
    related_id: app.applicationId,
    assigned_to: app.assignedTo || null,
    due_days: 2,
  });
  if (error) throw error;
  return true;
}

/**
 * Wires a newly inserted application into the CRM (`leads`), the student
 * binder requirements (`apprentice_document_types`, read by
 * /students/[id]/binder) and the staff task queue (`tasks`, read by
 * /staff-portal/tasks). Every step is idempotent so replays are safe.
 */
export async function onApplicationSubmitted(
  db: SupabaseClient,
  app: SubmittedApplication,
): Promise<ApplicationAutomationResult> {
  const email = app.email.trim().toLowerCase();
  const name = [app.firstName, app.lastName].map((part) => part?.trim()).filter(Boolean).join(' ') || email;
  const lead = await upsertLead(db, app, email);
  const binderDocuments = app.programSlug ? await upsertBinderChecklist(db, app.programSlug) : [];
  const taskCreated = await insertReviewTask(db, app, name);
  return { ...lead, binderDocuments, taskCreated };
}
