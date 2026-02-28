export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';


/**
 * Workflow Processor - Processes triggered workflows and sends drip emails
 * Run via cron every 5 minutes
 */
async function _GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    if (!resend) {
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const now = new Date();

    // Get active workflows
    const { data: workflows, error: workflowsError } = await db
      .from('email_workflows')
      .select('*')
      .eq('status', 'active');

    if (workflowsError) throw workflowsError;

    if (!workflows || workflows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active workflows',
        processed: 0,
      });
    }

    const results = [];

    for (const workflow of workflows) {
      try {
        // Check for new triggers
        await processNewTriggers(supabase, workflow, now);

        // Process pending workflow emails
        const processed = await processPendingEmails(supabase, workflow, now);

        results.push({
          workflowId: workflow.id,
          name: workflow.name,
          processed,
        });
      } catch (error) { 
        logger.error(
          `Error processing workflow ${workflow.id}:`,
          error instanceof Error ? error : new Error(String(error))
        );
        results.push({
          workflowId: workflow.id,
          name: workflow.name,
          error: toErrorMessage(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${workflows.length} workflows`,
      results,
    });
  } catch (error) { 
    logger.error(
      'Workflow processor error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * Check for new trigger events and enroll users in workflows
 */
async function processNewTriggers(supabase: any, workflow: any, now: Date) {
  const trigger = workflow.trigger_event;
  const lookbackMinutes = 5; // Check last 5 minutes
  const lookbackTime = new Date(
    now.getTime() - lookbackMinutes * 60 * 1000
  ).toISOString();

  let newUsers: any[] = [];

  switch (trigger) {
    case 'enrollment':
      // Find students enrolled in last 5 minutes
      const { data: enrolled } = await db
        .from('students')
        .select('id, email, first_name, last_name, program_name')
        .eq('status', 'active')
        .gte('created_at', lookbackTime)
        .not('email', 'is', null);
      newUsers = enrolled || [];
      break;

    case 'application':
      // Find new applications in last 5 minutes
      const { data: applications } = await db
        .from('students')
        .select('id, email, first_name, last_name, program_name')
        .eq('status', 'applicant')
        .gte('created_at', lookbackTime)
        .not('email', 'is', null);
      newUsers = applications || [];
      break;

    case 'completion':
      // Find completed programs in last 5 minutes
      const { data: completed } = await db
        .from('students')
        .select('id, email, first_name, last_name, program_name')
        .eq('status', 'completed')
        .gte('updated_at', lookbackTime)
        .not('email', 'is', null);
      newUsers = completed || [];
      break;

    case 'abandoned':
      // Find abandoned applications (24 hours old, not completed)
      const abandonedTime = new Date(
        now.getTime() - 24 * 60 * 60 * 1000
      ).toISOString();
      const { data: abandoned } = await db
        .from('students')
        .select('id, email, first_name, last_name, program_name')
        .eq('status', 'applicant')
        .eq('application_complete', false)
        .gte('created_at', abandonedTime)
        .lte('created_at', lookbackTime)
        .not('email', 'is', null);
      newUsers = abandoned || [];
      break;
  }

  // Enroll new users in workflow
  for (const user of newUsers) {
    // Check if already enrolled
    const { data: existing } = await db
      .from('workflow_enrollments')
      .select('id')
      .eq('workflow_id', workflow.id)
      .eq('user_id', user.id)
      .single();

    if (existing) continue; // Already enrolled

    // Enroll user
    await db.from('workflow_enrollments').insert({
      workflow_id: workflow.id,
      user_id: user.id,
      user_email: user.email,
      current_step: 0,
      enrolled_at: now.toISOString(),
      next_email_at: now.toISOString(), // Send first email immediately
    });
  }
}

/**
 * Process pending workflow emails
 */
async function processPendingEmails(supabase: any, workflow: any, now: Date) {
  // Get enrollments with pending emails
  const { data: enrollments, error } = await db
    .from('workflow_enrollments')
    .select('*')
    .eq('workflow_id', workflow.id)
    .eq('completed', false)
    .lte('next_email_at', now.toISOString());

  if (error || !enrollments || enrollments.length === 0) {
    return 0;
  }

  let processed = 0;

  for (const enrollment of enrollments) {
    try {
      const currentStep = enrollment.current_step;
      const steps = workflow.steps;

      if (currentStep >= steps.length) {
        // Workflow completed
        await db
          .from('workflow_enrollments')
          .update({
            completed: true,
            completed_at: now.toISOString(),
          })
          .eq('id', enrollment.id);
        continue;
      }

      const step = steps[currentStep];

      // Get user details
      const { data: user } = await db
        .from('students')
        .select('*')
        .eq('id', enrollment.user_id)
        .single();

      if (!user) continue;

      // Prepare email variables
      const variables = {
        firstName: user.first_name || 'there',
        lastName: user.last_name || '',
        email: user.email,
        programName: user.program_name || 'your program',
        portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/student`,
      };

      // Replace variables in content
      let html = step.customHtml;
      let subject = step.subject;

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, String(value));
        subject = subject.replace(regex, String(value));
      });

      // Send email
      await resend.emails.send({
        from: 'Elevate for Humanity <noreply@elevateforhumanity.org>',
        to: enrollment.user_email,
        subject,
        html,
      });

      // Calculate next email time
      const nextStep = currentStep + 1;
      let nextEmailAt = null;

      if (nextStep < steps.length) {
        const nextStepData = steps[nextStep];
        const delayMinutes =
          nextStepData.delayUnit === 'minutes'
            ? nextStepData.delay
            : nextStepData.delayUnit === 'hours'
              ? nextStepData.delay * 60
              : nextStepData.delay * 24 * 60;

        nextEmailAt = new Date(
          now.getTime() + delayMinutes * 60 * 1000
        ).toISOString();
      }

      // Update enrollment
      await db
        .from('workflow_enrollments')
        .update({
          current_step: nextStep,
          next_email_at: nextEmailAt,
          last_email_sent_at: now.toISOString(),
        })
        .eq('id', enrollment.id);

      // Log email
      await db.from('email_logs').insert({
        workflow_id: workflow.id,
        recipient_email: enrollment.user_email,
        recipient_id: enrollment.user_id,
        subject,
        status: 'sent',
        sent_at: now.toISOString(),
      });

      processed++;
    } catch (error) { 
      logger.error(
        `Error processing enrollment ${enrollment.id}:`,
        error instanceof Error ? error : new Error(String(error))
      );

      // Log failure
      await db.from('email_logs').insert({
        workflow_id: workflow.id,
        recipient_email: enrollment.user_email,
        recipient_id: enrollment.user_id,
        subject: 'Workflow email',
        status: 'failed',
        error_message: toErrorMessage(error),
      });
    }
  }

  return processed;
}

/**
 * Manual trigger for testing
 */
async function _POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

  return GET(req);
}
export const GET = withApiAudit('/api/email/workflows/processor', _GET);
export const POST = withApiAudit('/api/email/workflows/processor', _POST);
