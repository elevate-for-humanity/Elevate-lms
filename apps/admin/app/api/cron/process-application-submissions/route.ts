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
    // 1. Update CRM lead if exists
    const { data: existingLead } = await db
      .from('crm_leads')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingLead) {
      await db
        .from('crm_leads')
        .update({
          stage: 'application_received',
          status: 'in_progress',
          last_contact_at: new Date().toISOString(),
          notes: `Application submitted for ${programSlug || 'unknown program'}`,
        })
        .eq('id', existingLead.id);
      logger.info('[process-application-submissions] CRM lead updated', { leadId: existingLead.id });
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
      await db.from('tasks').insert({
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: 'pending',
        related_type: 'application',
        related_id: applicationId,
        assigned_to: null,
      });
    }
    logger.info('[process-application-submissions] Checklist created', { applicationId, itemCount: checklistItems.length });

    // 3. Create timeline event
    await db.from('timeline_events').insert({
      entity_type: 'application',
      entity_id: applicationId,
      event_type: 'application_submitted',
      title: 'Application Submitted',
      description: `Application submitted for ${programSlug || 'program'}`,
      metadata: { programSlug, fundingType, firstName, lastName },
    });

    // 4. Queue PARIS analysis (if PARIS is configured)
    await db.from('job_queue').insert({
      type: 'paris_analyze_application',
      payload: { applicationId, programSlug },
      run_after: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    logger.info('[process-application-submissions] Application processed successfully', { applicationId });
    return { success: true };
  } catch (error) {
    logger.error('[process-application-submissions] Failed to process application', error instanceof Error ? error : new Error(String(error)), { applicationId });
    return { success: false, error: String(error) };
  }
}

async function _GET(req: NextRequest) {
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
