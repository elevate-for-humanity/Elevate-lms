import { NextResponse } from 'next/server';
import { claimJobs, completeJob, failJob, ProvisioningJob } from '@/lib/jobs/queue';
import { logger } from '@/lib/logger';
import { processLicenseProvision } from '@/lib/jobs/handlers/license-provision';
import { processLicenseSuspend } from '@/lib/jobs/handlers/license-suspend';
import { processEmailSend } from '@/lib/jobs/handlers/email-send';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

async function processTenantSetup(job: ProvisioningJob): Promise<void> {
  const { organizationId, subdomain, planId, contactEmail } = job.payload as {
    organizationId: string;
    subdomain: string;
    planId: string;
    contactEmail: string;
  };

  logger.info('Processing tenant setup', { organizationId, subdomain });

  const supabase = getSupabaseAdmin();

  // Create default settings for the tenant
  await supabase.from('organization_settings').upsert({
    organization_id: organizationId,
    settings: {
      branding: {
        primaryColor: '#3B82F6',
        logoUrl: null,
        faviconUrl: null,
      },
      features: {
        courses: true,
        certificates: true,
        analytics: true,
        api: planId === 'enterprise',
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
      },
    },
    updated_at: new Date().toISOString(),
  });

  // Create default roles for the organization
  const defaultRoles = ['admin', 'instructor', 'student'];
  for (const role of defaultRoles) {
    await supabase.from('organization_roles').upsert({
      organization_id: organizationId,
      role_name: role,
      permissions: getDefaultPermissions(role),
    });
  }

  // Log setup completion
  await supabase.from('license_events').insert({
    organization_id: organizationId,
    event_type: 'tenant_setup_complete',
    event_data: { subdomain, planId },
  });

  logger.info('Tenant setup complete', { organizationId });
}

function getDefaultPermissions(role: string): string[] {
  switch (role) {
    case 'admin':
      return ['manage_users', 'manage_courses', 'manage_settings', 'view_analytics', 'manage_billing'];
    case 'instructor':
      return ['manage_courses', 'view_students', 'grade_assignments'];
    case 'student':
      return ['view_courses', 'submit_assignments', 'view_grades'];
    default:
      return [];
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * STEP 6A: Job worker endpoint
 * 
 * Processes queued provisioning jobs with:
 * - Atomic job claiming (skip locked)
 * - Retry with exponential backoff
 * - Dead letter after max attempts
 * - Full correlation tracing
 * 
 * Call via cron every minute or on-demand
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('Unauthorized cron attempt', { 
      path: '/api/cron/process-provisioning-jobs' 
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const startTime = Date.now();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  
  try {
    // Claim up to 25 jobs atomically
    const jobs = await claimJobs(25);
    
    logger.info('Jobs claimed for processing', { count: jobs.length });
    
    for (const job of jobs) {
      try {
        await processJob(job);
        await completeJob(job.id);
        succeeded++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await failJob(job.id, errorMessage);
        failed++;
        
        logger.error('Job processing failed', error instanceof Error ? error : new Error(errorMessage), {
          jobId: job.id,
          jobType: job.job_type,
          correlationId: job.correlation_id,
          attempt: job.attempts,
        });
      }
      processed++;
    }
    
    const duration = Date.now() - startTime;
    
    logger.info('Job processing complete', { 
      processed, 
      succeeded, 
      failed, 
      durationMs: duration 
    });
    
    return NextResponse.json({
      success: true,
      processed,
      succeeded,
      failed,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Job worker failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Worker failed', processed, succeeded, failed },
      { status: 500 }
    );
  }
}

/**
 * Route job to appropriate handler
 */
async function processJob(job: ProvisioningJob): Promise<void> {
  logger.info('Processing job', {
    jobId: job.id,
    jobType: job.job_type,
    correlationId: job.correlation_id,
    attempt: job.attempts,
  });
  
  switch (job.job_type) {
    case 'license_provision':
      await processLicenseProvision(job);
      break;
      
    case 'license_suspend':
      await processLicenseSuspend(job);
      break;
      
    case 'license_reactivate':
      await processLicenseSuspend(job); // Same handler, different action
      break;
      
    case 'email_send':
      await processEmailSend(job);
      break;
      
    case 'tenant_setup':
      await processTenantSetup(job);
      break;
      
    case 'webhook_process':
      // Generic webhook processing
      logger.info('Webhook process job', { jobId: job.id, payload: job.payload });
      break;
      
    default:
      throw new Error(`Unknown job type: ${job.job_type}`);
  }
}
