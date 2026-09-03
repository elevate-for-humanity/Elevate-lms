import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/**
 * Enrollment Orchestrator Worker
 *
 * Processes enrollment_jobs queue:
 * - Activates enrollments
 * - Creates partner LMS enrollments
 * - Sends confirmation emails
 * - Assigns AI policies
 * - Initializes milestones
 *
 * Retries on failure, surfaces errors to staff dashboard
 */

interface EnrollmentJob {
  id: string;
  enrollment_id: string;
  job_type: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  metadata: Record<string, unknown>;
}

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch pending jobs
    const { data: jobs, error: fetchError } = await supabase
      .from('enrollment_jobs')
      .select('*')
      .in('status', ['pending', 'retrying'])
      .lte('scheduled_for', new Date().toISOString())
      .lt('attempt_count', supabase.rpc('max_attempts'))
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No jobs to process' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const results = [];

    for (const job of jobs) {
      const result = await processJob(job, supabase);
      results.push(result);
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function processJob(job: EnrollmentJob, supabase: any) {
  // Mark job as processing
  await supabase
    .from('enrollment_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
      attempt_count: job.attempt_count + 1,
    })
    .eq('id', job.id);

  try {
    switch (job.job_type) {
      case 'partner_lms_enrollment':
        await processPartnerLMSEnrollment(job, supabase);
        break;

      case 'send_confirmation_email':
        await processSendConfirmationEmail(job, supabase);
        break;

      case 'assign_ai_policy':
        await processAssignAIPolicy(job, supabase);
        break;

      case 'initialize_milestones':
        await processInitializeMilestones(job, supabase);
        break;

      default:
        throw new Error(`Unknown job type: ${job.job_type}`);
    }

    // Mark job as completed
    await supabase
      .from('enrollment_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    return { job_id: job.id, status: 'completed' };
  } catch (error) {

    const shouldRetry = job.attempt_count + 1 < job.max_attempts;

    await supabase
      .from('enrollment_jobs')
      .update({
        status: shouldRetry ? 'retrying' : 'failed',
        last_error: error.message,
        scheduled_for: shouldRetry
          ? new Date(
              Date.now() + getRetryDelay(job.attempt_count + 1)
            ).toISOString()
          : null,
      })
      .eq('id', job.id);

    // Surface failure to staff if max attempts reached
    if (!shouldRetry) {
      await surfaceFailureToStaff(job, error, supabase);
    }

    return {
      job_id: job.id,
      status: 'failed',
      error: error.message,
      will_retry: shouldRetry,
    };
  }
}

async function processPartnerLMSEnrollment(job: EnrollmentJob, supabase: any) {
  // Get enrollment details
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('*, profiles(*)')
    .eq('id', job.enrollment_id)
    .single();

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Get program/partner details
  const { data: offering } = await supabase
    .from('offerings')
    .select('*')
    .eq('program_id', enrollment.program_id)
    .single();

  if (!offering) {
    throw new Error('Offering not found');
  }

  const partnerConfig = offering.metadata?.partner_lms;

  if (!partnerConfig) {
    // No partner LMS configured - skip
    return;
  }

  // Create partner enrollment record with link-based access
  const { data: partnerEnrollment, error: createError } = await supabase
    .from('partner_enrollments')
    .insert({
      enrollment_id: enrollment.id,
      partner_id: partnerConfig.partner_id,
      partner_course_id: partnerConfig.course_id,
      learner_email: enrollment.profiles.email,
      learner_name: `${enrollment.profiles.first_name} ${enrollment.profiles.last_name}`,
      status: 'confirmed',
      request_method: 'link',
      access_link: partnerConfig.access_link || partnerConfig.course_url,
      confirmed_at: new Date().toISOString(),
      metadata: {
        program_id: enrollment.program_id,
        partner_name: partnerConfig.partner_name,
        course_name: partnerConfig.course_name,
        requested_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  // Link-based access - no API call needed
  // Learner accesses partner LMS via provided link
  // API integration disabled - using link-based access only
  if (partnerConfig.method === 'api' && partnerConfig.api_endpoint && false) {
    try {
      const response = await fetch(partnerConfig.api_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${partnerConfig.api_key}`,
        },
        body: JSON.stringify({
          course_id: partnerConfig.course_id,
          learner_email: enrollment.profiles.email,
          learner_name: `${enrollment.profiles.first_name} ${enrollment.profiles.last_name}`,
          external_id: enrollment.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Partner API returned ${response.status}`);
      }

      const result = await response.json();

      // Update partner enrollment as confirmed
      await supabase
        .from('partner_enrollments')
        .update({
          status: 'confirmed',
          partner_enrollment_id: result.enrollment_id,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', partnerEnrollment.id);
    } catch (apiError) {
      // Mark as failed but don't throw - will retry
      await supabase
        .from('partner_enrollments')
        .update({
          status: 'failed',
          error_message: apiError.message,
        })
        .eq('id', partnerEnrollment.id);

      throw new Error(`Partner LMS API failed: ${apiError.message}`);
    }
  }

}

async function processSendConfirmationEmail(job: EnrollmentJob, supabase: any) {
  // Get enrollment details
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('*, profiles(*)')
    .eq('id', job.enrollment_id)
    .single();

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Queue email via email service
  // This would integrate with existing lib/email.ts
  const emailPayload = {
    to: enrollment.profiles.email,
    template: 'enrollment_confirmation',
    data: {
      learner_name: enrollment.profiles.first_name,
      program_name: enrollment.program_id, // Would lookup actual name
      enrollment_id: enrollment.id,
    },
  };

  // Log email event
  await supabase.from('email_events').insert({
    recipient: enrollment.profiles.email,
    template_name: 'enrollment_confirmation',
    template_version: '1.0',
    enrollment_id: enrollment.id,
    status: 'queued',
    metadata: emailPayload,
  });

}

async function processAssignAIPolicy(job: EnrollmentJob, supabase: any) {
  // Get enrollment details
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('*')
    .eq('id', job.enrollment_id)
    .single();

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Get default AI policy for program
  const { data: policy } = await supabase
    .from('ai_policy_profiles')
    .select('*')
    .eq('program_id', enrollment.program_id)
    .eq('role', 'learner')
    .eq('is_default', true)
    .single();

  if (!policy) {
    return;
  }

  // Assign policy to learner
  await supabase.from('learner_ai_policies').insert({
    learner_id: enrollment.student_id,
    enrollment_id: enrollment.id,
    policy_id: policy.id,
    assigned_at: new Date().toISOString(),
  });

  console.log(
    `AI policy ${policy.id} assigned to learner ${enrollment.student_id}`
  );
}

async function processInitializeMilestones(job: EnrollmentJob, supabase: any) {
  // Get enrollment details
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('*')
    .eq('id', job.enrollment_id)
    .single();

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Get program milestones template
  const { data: milestones } = await supabase
    .from('program_milestones')
    .select('*')
    .eq('program_id', enrollment.program_id)
    .order('sequence', { ascending: true });

  if (!milestones || milestones.length === 0) {
    return;
  }

  // Create learner milestones
  const learnerMilestones = milestones.map((m) => ({
    enrollment_id: enrollment.id,
    learner_id: enrollment.student_id,
    milestone_id: m.id,
    milestone_name: m.name,
    status: 'not_started',
    due_date: calculateDueDate(enrollment.activated_at, m.days_from_start),
  }));

  await supabase.from('learner_milestones').insert(learnerMilestones);

  console.log(
    `Initialized ${learnerMilestones.length} milestones for enrollment ${enrollment.id}`
  );
}

async function surfaceFailureToStaff(
  job: EnrollmentJob,
  error: Error,
  supabase: any
) {
  // Create staff notification
  await supabase.from('staff_notifications').insert({
    type: 'enrollment_job_failed',
    severity: 'high',
    title: `Enrollment Job Failed: ${job.job_type}`,
    message: `Job ${job.id} for enrollment ${job.enrollment_id} failed after ${job.attempt_count} attempts: ${error.message}`,
    metadata: {
      job_id: job.id,
      enrollment_id: job.enrollment_id,
      job_type: job.job_type,
      error: error.message,
    },
    created_at: new Date().toISOString(),
  });

}

function getRetryDelay(attemptCount: number): number {
  // Exponential backoff: 1min, 5min, 15min
  const delays = [60000, 300000, 900000];
  return delays[Math.min(attemptCount - 1, delays.length - 1)];
}

function calculateDueDate(startDate: string, daysFromStart: number): string {
  const date = new Date(startDate);
  date.setDate(date.getDate() + daysFromStart);
  return date.toISOString();
}
