import { generateDeterministicId } from '@/lib/utils/id-generator';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApplicationSubmittedPayload } from '@/lib/admissions/process-application-submitted';

/** Persist the only admissions side-effect pipeline after intake is saved. */
export async function enqueueApplicationSubmission(db: SupabaseClient, payload: ApplicationSubmittedPayload): Promise<void> {
  // Existing jobs retain their status, attempts and original ID, even after
  // failure. Never create a replacement that would reset an exhausted budget.
  const { data: existing, error: lookupError } = await db.from('job_queue').select('id')
    .eq('type', 'application_submitted').contains('payload', { applicationId: payload.applicationId }).limit(1).maybeSingle();
  if (lookupError) throw new Error('APPLICATION_AUTOMATION_QUEUE_LOOKUP_FAILED');
  if (existing) return;
  const { error } = await db.from('job_queue').upsert({
    id: generateDeterministicId(`admissions:${payload.applicationId}:submission`),
    type: 'application_submitted',
    payload,
    run_after: new Date().toISOString(),
  }, { onConflict: 'id', ignoreDuplicates: true });
  // PostgREST returns write errors; it does not usually reject the promise.
  if (error) {
    const code = /^(?:[0-9A-Z]{5}|PGRST[0-9]{3})$/.test(error.code || '') ? error.code : 'UNAVAILABLE';
    throw new Error(`APPLICATION_AUTOMATION_QUEUE_WRITE_FAILED:${code}`);
  }
}
