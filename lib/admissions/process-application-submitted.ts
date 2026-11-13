import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { resolveCanonicalSlug } from '@/lib/programs/slug';
import { generateDeterministicId } from '@/lib/utils/id-generator';
import { ensureApplicationBinderChecklist, escapeLikePattern } from '@/lib/admissions/on-application-submitted';

export interface ApplicationSubmittedPayload {
  applicationId: string;
  programSlug: string | null;
  email: string;
  firstName: string;
  lastName: string;
  fundingType: string | null;
}

export async function processApplicationSubmitted(db: SupabaseClient, payload: ApplicationSubmittedPayload) {
  const { applicationId, email, fundingType } = payload;

  let stage = 'APPLICATION';
  logger.info('[process-application-submissions] Processing application', { applicationId });

  try {
    // Use the saved canonical application as evidence, never trust the queue
    // payload alone for attribution, identity or staff access decisions.
    const { data: application, error: applicationError } = await db
      .from('applications')
      .select('id, email, phone, first_name, last_name, source, program_interest, program_slug, program_id, advisor_assigned, user_id')
      .eq('id', applicationId)
      .maybeSingle();
    if (applicationError) throw applicationError;
    if (!application) throw new Error('APPLICATION_NOT_FOUND');
    if (application.email?.trim().toLowerCase() !== email.trim().toLowerCase()) {
      throw new Error('APPLICATION_IDENTITY_MISMATCH');
    }

    stage = 'PROGRAM';
    const savedProgram = application.program_slug?.trim() || application.program_interest?.trim();
    const programQuery = db.from('programs').select('id,slug');
    const { data: program, error: programError } = await (application.program_id
      ? programQuery.eq('id', application.program_id)
      : programQuery.eq('slug', resolveCanonicalSlug(savedProgram || ''))).maybeSingle();
    if (programError) throw programError;
    if (!program) throw new Error('PROGRAM_REVIEW_REQUIRED');

    stage = 'BINDER';
    await ensureApplicationBinderChecklist(db, program.slug);

    // 1. Create or reconcile the existing CRM lead, respecting the unique
    // email contract and never downgrading an already advanced lead stage.
    stage = 'CRM';
    const normalizedEmail = application.email.trim().toLowerCase();
    const { data: existingLead, error: leadLookupError } = await db
      .from('crm_leads')
      .select('id, stage, status, owner_user_id')
      .ilike('email', escapeLikePattern(normalizedEmail))
      .limit(1)
      .maybeSingle();
    if (leadLookupError) throw leadLookupError;

    let ownerId = existingLead?.owner_user_id || application.advisor_assigned || null;
    if (existingLead) {
      const { error: leadUpdateError } = await db.from('crm_leads').update({
        application_id: applicationId,
        last_contact_at: new Date().toISOString(),
        ...(existingLead.stage === 'new' ? { stage: 'application_received' } : {}),
        ...(existingLead.status === 'new' ? { status: 'in_progress' } : {}),
      }).eq('id', existingLead.id);
      if (leadUpdateError) throw leadUpdateError;
    } else {
      const { error: leadInsertError } = await db.from('crm_leads').insert({
        full_name: [application.first_name, application.last_name].filter(Boolean).join(' '),
        email: normalizedEmail,
        phone: application.phone,
        source: application.source || 'website',
        program_slug: program.slug,
        stage: 'application_received',
        status: 'in_progress',
        application_id: applicationId,
        owner_user_id: ownerId,
        profile_id: application.user_id || null,
      });
      if (leadInsertError) {
        if (leadInsertError.code !== '23505') throw leadInsertError;
        // On concurrent email-unique insertion, recover the winning row and
        // link this canonical application instead of falsely reporting success.
        const { data: winningLead, error: recoveryError } = await db
          .from('crm_leads').select('id,owner_user_id')
          .ilike('email', escapeLikePattern(normalizedEmail)).limit(1).maybeSingle();
        if (recoveryError || !winningLead) throw new Error('CRM lead conflict could not be reconciled');
        ownerId = winningLead.owner_user_id || ownerId;
        const { error: linkError } = await db.from('crm_leads')
          .update({ application_id: applicationId })
          .eq('id', winningLead.id);
        if (linkError) throw linkError;
      }
    }

    // 2. Create admission checklist tasks
    stage = 'TASKS';
    const checklistItems = [
      { title: 'Review application', description: 'Review submitted application and verify completeness', priority: 'high' },
      { title: 'Verify funding eligibility', description: `Check ${fundingType || 'self-pay'} funding status`, priority: 'high' },
      { title: 'Schedule interview', description: 'Contact applicant to schedule enrollment interview', priority: 'medium' },
      { title: 'Collect documents', description: 'Request required documents for digital binder', priority: 'medium' },
      { title: 'Send welcome packet', description: 'Send enrollment information and next steps', priority: 'low' },
    ];

    // Keep earlier review tasks (including completed tasks) instead of
    // creating a second differently titled review for the same application.
    const { data: priorTasks, error: priorTasksError } = await db.from('tasks')
      .select('id,title').eq('related_type', 'application').eq('related_id', applicationId);
    if (priorTasksError) throw priorTasksError;
    for (const item of checklistItems) {
      if (item.title === 'Review application' && priorTasks?.some(task =>
        task.title === item.title || task.title?.startsWith('Review application from '))) continue;
      // A prior worker may have completed some tasks before failing. Replays
      // must not create another checklist for the same application.
      const { data: existingTask, error: taskLookupError } = await db.from('tasks')
        .select('id')
        .eq('related_type', 'application')
        .eq('related_id', applicationId)
        .eq('title', item.title)
        .limit(1)
        .maybeSingle();
      if (taskLookupError) throw taskLookupError;
      if (existingTask) continue;
      const { error: taskError } = await db.from('tasks').upsert({
        id: generateDeterministicId(`admissions:${applicationId}:task:${item.title}`),
        program_id: program.id,
        instructions: item.description,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: 'pending',
        related_type: 'application',
        related_id: applicationId,
        assigned_to: ownerId,
        due_days: item.priority === 'high' ? 2 : 7,
      }, { onConflict: 'id', ignoreDuplicates: true });
      if (taskError) throw taskError;
    }
    logger.info('[process-application-submissions] Checklist created', { applicationId, itemCount: checklistItems.length });

    stage = 'TIMELINE';
    // 3. Create timeline event
    const { data: priorEvent, error: eventLookupError } = await db
      .from('timeline_events').select('id')
      .eq('entity_type', 'application').eq('entity_id', applicationId)
      .eq('event_type', 'application_submitted').limit(1).maybeSingle();
    if (eventLookupError) throw eventLookupError;
    if (!priorEvent) {
      const { error: timelineError } = await db.from('timeline_events').upsert({
        id: generateDeterministicId(`admissions:${applicationId}:timeline:submitted`),
        entity_type: 'application',
        entity_id: applicationId,
        event_type: 'application_submitted',
        title: 'Application Submitted',
        description: `Application submitted for ${program.slug}`,
        metadata: { programSlug: program.slug, fundingType, firstName: application.first_name, lastName: application.last_name },
      }, { onConflict: 'id', ignoreDuplicates: true });
      if (timelineError) throw timelineError;
    }

    stage = 'PARIS';
    // 4. Queue PARIS analysis (if PARIS is configured)
    // Queue one PARIS analysis per application only if one is not already
    // recorded. This is a request, not evidence that PARIS accepted a repair.
    if (process.env.PARIS_APPLICATION_ANALYSIS_ENABLED === 'true') {
      const { data: priorParisJob, error: parisLookupError } = await db.from('job_queue')
        .select('id').eq('type', 'paris_analyze_application')
        .contains('payload', { applicationId }).limit(1).maybeSingle();
      if (parisLookupError) throw parisLookupError;
      if (!priorParisJob) {
        const { error: parisQueueError } = await db.from('job_queue').upsert({
          id: generateDeterministicId(`admissions:${applicationId}:paris-analysis`),
          type: 'paris_analyze_application',
          payload: { applicationId, programSlug: program.slug },
          run_after: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: true });
        if (parisQueueError) throw parisQueueError;
      }
    }

    logger.info('[process-application-submissions] Application processed successfully', { applicationId });
    return { success: true };
  } catch (error) {
    // Keep only a known stage and machine code. Database messages/details may
    // contain applicant values and must never enter the queue failure ledger.
    const rawCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    const dbCode = /^(?:[0-9A-Z]{5}|PGRST[0-9]{3})$/.test(rawCode) ? rawCode : null;
    const knownError = error instanceof Error && ['APPLICATION_NOT_FOUND', 'APPLICATION_IDENTITY_MISMATCH', 'PROGRAM_REVIEW_REQUIRED'].includes(error.message)
      ? error.message : null;
    const code = knownError === 'PROGRAM_REVIEW_REQUIRED' ? 'ADMISSIONS_PROGRAM_REVIEW_REQUIRED'
      : `ADMISSIONS_${stage}_${dbCode || knownError || 'UNAVAILABLE'}`;
    const retryable = dbCode
      ? /^(08|40|53)/.test(dbCode) || ['55P03', '57014', '57P01', '57P02', '57P03', 'PGRST000', 'PGRST001', 'PGRST002', 'PGRST003'].includes(dbCode)
      : !knownError;
    logger.error('[process-application-submissions] Failed to process application', undefined, { applicationId, stage, code });
    return { success: false, error: code, retryable };
  }
}
