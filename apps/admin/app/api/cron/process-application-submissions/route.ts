/**
 * Process application_submitted jobs from the job queue.
 * 
 * This cron job handles post-submission automation:
 * - Creates admission checklist
 * - Generates tasks for recruiters
 * - Triggers PARIS AI analysis
 * - Updates CRM leads
 * 
 * Runs every 5 minutes via GitHub Actions cron or Supabase pg_cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { setAuditContext } from '@/lib/audit-context';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface ApplicationSubmittedPayload {
  applicationId: string;
  programSlug: string | null;
  email: string;
  firstName: string;
  lastName: string;
  fundingType: string | null;
}

async function processApplicationSubmitted(db: Awaited<ReturnType<typeof requireAdminClient>>, payload: ApplicationSubmittedPayload) {
  const { applicationId, programSlug, email, firstName, lastName, fundingType } = payload;
  
  logger.info('[process-application-submissions] Processing application', { applicationId });

  try {
    // Use the saved canonical application as evidence, never trust the queue
    // payload alone for attribution, identity or staff access decisions.
    const { data: application, error: applicationError } = await db
      .from('applications')
      .select('id, email, phone, first_name, last_name, source, program_interest, program_slug, advisor_assigned, user_id')
      .eq('id', applicationId)
      .maybeSingle();
    if (applicationError || !application) throw new Error('Canonical application could not be loaded');
    if (application.email?.trim().toLowerCase() !== email.trim().toLowerCase()) {
      throw new Error('Queue identity does not match canonical application');
    }

    // 1. Create or reconcile the existing CRM lead, respecting the unique
    // email contract and never downgrading an already advanced lead stage.
    const normalizedEmail = application.email.trim().toLowerCase();
    const { data: existingLead, error: leadLookupError } = await db
      .from('crm_leads')
      .select('id, stage, status')
      .ilike('email', normalizedEmail)
      .limit(1)
      .maybeSingle();
    if (leadLookupError) throw leadLookupError;

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
        program_slug: application.program_slug || application.program_interest || programSlug,
        stage: 'application_received',
        status: 'in_progress',
        application_id: applicationId,
        owner_user_id: application.advisor_assigned || null,
        profile_id: application.user_id || null,
      });
      if (leadInsertError) {
        if (leadInsertError.code !== '23505') throw leadInsertError;
        // On concurrent email-unique insertion, recover the winning row and
        // link this canonical application instead of falsely reporting success.
        const { data: winningLead, error: recoveryError } = await db
          .from('crm_leads').select('id')
          .ilike('email', normalizedEmail).limit(1).maybeSingle();
        if (recoveryError || !winningLead) throw new Error('CRM lead conflict could not be reconciled');
        const { error: linkError } = await db.from('crm_leads')
          .update({ application_id: applicationId })
          .eq('id', winningLead.id);
        if (linkError) throw linkError;
      }
    }

    // 2. Create admission checklist tasks
    const checklistItems = [
      { title: 'Review application', description: 'Review submitted application and verify completeness', priority: 'high' },
      { title: 'Verify funding eligibility', description: `Check ${fundingType || 'self-pay'} funding status`, priority: 'high' },
      { title: 'Schedule interview', description: 'Contact applicant to schedule enrollment interview', priority: 'medium' },
      { title: 'Collect documents', description: 'Request required documents for digital binder', priority: 'medium' },
      { title: 'Send welcome packet', description: 'Send enrollment information and next steps', priority: 'low' },
    ];

    for (const item of checklistItems) {
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
      const { error: taskError } = await db.from('tasks').insert({
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: 'pending',
        related_type: 'application',
        related_id: applicationId,
        assigned_to: application.advisor_assigned || null,
        due_days: item.priority === 'high' ? 2 : 7,
      });
      if (taskError) throw taskError;
    }
    logger.info('[process-application-submissions] Checklist created', { applicationId, itemCount: checklistItems.length });

    // 3. Create timeline event
    const { data: priorEvent, error: eventLookupError } = await db
      .from('timeline_events').select('id')
      .eq('entity_type', 'application').eq('entity_id', applicationId)
      .eq('event_type', 'application_submitted').limit(1).maybeSingle();
    if (eventLookupError) throw eventLookupError;
    if (!priorEvent) {
      const { error: timelineError } = await db.from('timeline_events').insert({
        entity_type: 'application',
        entity_id: applicationId,
        event_type: 'application_submitted',
        title: 'Application Submitted',
        description: `Application submitted for ${programSlug || 'program'}`,
        metadata: { programSlug, fundingType, firstName, lastName },
      });
      if (timelineError) throw timelineError;
    }

    // 4. Queue PARIS analysis (if PARIS is configured)
    // Queue one PARIS analysis per application only if one is not already
    // recorded. This is a request, not evidence that PARIS accepted a repair.
    if (process.env.PARIS_APPLICATION_ANALYSIS_ENABLED === 'true') {
      const { data: priorParisJob, error: parisLookupError } = await db.from('job_queue')
        .select('id').eq('type', 'paris_analyze_application')
        .contains('payload', { applicationId }).limit(1).maybeSingle();
      if (parisLookupError) throw parisLookupError;
      if (!priorParisJob) {
        const { error: parisQueueError } = await db.from('job_queue').insert({
          type: 'paris_analyze_application',
          payload: { applicationId, programSlug },
          run_after: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        });
        if (parisQueueError) throw parisQueueError;
      }
    }

    logger.info('[process-application-submissions] Application processed successfully', { applicationId });
    return { success: true };
  } catch (error) {
    logger.error('[process-application-submissions] Failed to process application', error instanceof Error ? error : new Error(String(error)), { applicationId });
    return { success: false, error: String(error) };
  }
}

async function _GET(req: NextRequest) {
  // Scheduler-only endpoint: no anonymous applicant/CRM processing.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const db = await requireAdminClient();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    await setAuditContext(db, { systemActor: 'cron:process-application-submissions' });

    const now = new Date().toISOString();
    // Include only overdue processing leases: a previous worker may have
    // crashed, but a current owner must never be interrupted.
    const { data: jobs, error: jobsError } = await db
      .from('job_queue')
      .select('*')
      .eq('type', 'application_submitted')
      .in('status', ['pending', 'processing'])
      .lte('run_after', now)
      .order('created_at', { ascending: true })
      .limit(10);

    if (jobsError) {
      logger.error('[process-application-submissions] Failed to fetch jobs', new Error(jobsError.message));
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (!jobs?.length) {
      return NextResponse.json({ processed: 0, failed: 0, message: 'No due jobs' });
    }

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const job of jobs) {
      const previousAttempts = Number(job.attempts ?? 0);
      const maxAttempts = Number(job.max_attempts ?? 3);
      if (previousAttempts >= maxAttempts) {
        // Attempt budgets are durable. Do not reset or replay exhausted jobs.
        skipped++;
        continue;
      }

      const attempt = previousAttempts + 1;
      const leaseUntil = new Date(Date.now() + 3 * 60 * 1000).toISOString();
      const { data: claimed, error: claimError } = await db.from('job_queue')
        .update({ status: 'processing', attempts: attempt, run_after: leaseUntil })
        .eq('id', job.id)
        .eq('status', job.status)
        .eq('attempts', previousAttempts)
        .lte('run_after', now)
        .select('id')
        .maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) {
        skipped++; // Another execution owns this job.
        continue;
      }

      try {
        const payload = job.payload as ApplicationSubmittedPayload;
        if (!payload?.applicationId || !payload?.email) {
          throw new Error('Application submission job lacks canonical identity fields');
        }
        const result = await processApplicationSubmitted(db, payload);
        if (!result.success) throw new Error('Post-submission processing did not complete');

        const { data: completed, error: completeError } = await db.from('job_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            error: null,
            last_error: null,
          })
          .eq('id', job.id).eq('status', 'processing').eq('attempts', attempt)
          .select('id').maybeSingle();
        if (completeError) throw completeError;
        if (!completed) throw new Error('Application job completion lease lost');
        processed++;
      } catch (jobError) {
        const message = jobError instanceof Error ? jobError.message : String(jobError);
        // Do not log applicant email or full name. Retain the cumulative attempt
        // count and expose terminal failure rather than fabricate completion.
        logger.error('[process-application-submissions] Job failed', undefined, {
          jobId: job.id, attempt, maxAttempts,
        });
        const exhausted = attempt >= maxAttempts;
        const { error: failureUpdateError } = await db.from('job_queue')
          .update({
            status: exhausted ? 'failed' : 'pending',
            run_after: exhausted ? leaseUntil : new Date(Date.now() + attempt * 5 * 60 * 1000).toISOString(),
            completed_at: exhausted ? new Date().toISOString() : null,
            last_error: message,
            error: message,
          })
          .eq('id', job.id).eq('status', 'processing').eq('attempts', attempt);
        if (failureUpdateError) throw failureUpdateError;
        failed++;
      }
    }

    logger.info('[process-application-submissions] Batch complete', { processed, failed, skipped, total: jobs.length });

    return NextResponse.json({ processed, failed, skipped, total: jobs.length }, { status: failed ? 503 : 200 });
  } catch (error) {
    logger.error('[process-application-submissions] Cron failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}

export const GET = _GET;
