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
      if (leadInsertError && leadInsertError.code !== '23505') throw leadInsertError;
      // Concurrent submissions may race on crm_leads.email; the unique key
      // allows one canonical lead. A later job can reconcile its application.
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

    const { data: jobs, error: jobsError } = await db
      .from('job_queue')
      .select('*')
      .eq('type', 'application_submitted')
      .eq('status', 'pending')
      .lte('run_after', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(10);

    if (jobsError) {
      logger.error('[process-application-submissions] Failed to fetch jobs', new Error(jobsError.message));
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No jobs to process' });
    }

    let processed = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        const payload = job.payload as ApplicationSubmittedPayload;
        const result = await processApplicationSubmitted(db, payload);

        await db
          .from('job_queue')
          .update({ 
            status: result.success ? 'completed' : 'failed',
            completed_at: new Date().toISOString(),
            error: result.success ? null : result.error,
          })
          .eq('id', job.id);

        if (result.success) processed++;
        else failed++;
      } catch (jobError) {
        logger.error('[process-application-submissions] Job failed', jobError instanceof Error ? jobError : new Error(String(jobError)), { jobId: job.id });
        await db
          .from('job_queue')
          .update({ 
            status: 'failed',
            completed_at: new Date().toISOString(),
            error: String(jobError),
          })
          .eq('id', job.id);
        failed++;
      }
    }

    logger.info('[process-application-submissions] Batch complete', { processed, failed, total: jobs.length });

    return NextResponse.json({ processed, failed, total: jobs.length });
  } catch (error) {
    logger.error('[process-application-submissions] Cron failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}

export const GET = _GET;
