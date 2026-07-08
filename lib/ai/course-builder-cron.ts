/**
 * Course Builder Cron Jobs and Event Triggers
 * 
 * Automated scans:
 * - Every night at 2:00 AM: Full gap scan
 * - On program creation: Program-specific scan
 * - On SOC/credential update: Data enrichment scan
 * - On course edit/delete: Impact assessment
 */

import { createClient } from '@supabase/supabase-js';
import { scanAllGaps } from './course-gap-detection';
import { runWorkforceGapScan, autoGenerateNewProgram, saveScanResults } from './workforce-gap-scanner';
import { processCourseGenerationJob } from './course-generation-worker';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Maximum jobs to process per cron run
const MAX_JOBS_PER_RUN = 5;

/**
 * Process pending course generation jobs
 * Should be called by a cron job every 10-30 seconds
 */
export async function processPendingJobs(): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    // Get queued jobs
    const { data: jobs } = await supabase
      .from('course_generation_jobs')
      .select('id, retry_count, max_retries')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(MAX_JOBS_PER_RUN);

    for (const job of jobs || []) {
      try {
        // Check retry limits
        if ((job.retry_count || 0) >= (job.max_retries || 3)) {
          await supabase
            .from('course_generation_jobs')
            .update({ status: 'failed', error_message: 'Max retries exceeded' })
            .eq('id', job.id);
          failed++;
          continue;
        }

        await processCourseGenerationJob(job.id);
        processed++;
      } catch (error) {
        logger.error(`Error processing job ${job.id}:`, error);
        errors.push(`Job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }
  } catch (error) {
    logger.error('Error in processPendingJobs:', error);
    errors.push(`Process error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { processed, failed, errors };
}

/**
 * Nightly gap scan - runs at 2:00 AM
 * This is called by a cron trigger (Northflank, Railway, etc.)
 */
export async function runNightlyGapScan(): Promise<{
  success: boolean;
  gapScan?: Awaited<ReturnType<typeof scanAllGaps>>;
  workforceScan?: Awaited<ReturnType<typeof runWorkforceGapScan>>;
  error?: string;
}> {
  logger.info('Starting nightly gap scan...');

  try {
    // Run gap scan
    const gapScan = await scanAllGaps();
    logger.info(`Gap scan complete: ${gapScan.total_gaps} gaps found`);

    // Run workforce gap scan
    const workforceScan = await runWorkforceGapScan();
    logger.info(`Workforce scan complete: ${workforceScan.new_opportunities.length} new opportunities`);

    // Auto-generate high-priority new programs (as drafts)
    for (const opportunity of workforceScan.new_opportunities.filter(
      o => o.recommendation_priority === 'high'
    ).slice(0, 3)) {
      try {
        await autoGenerateNewProgram(opportunity);
        logger.info(`Created auto-generation job for: ${opportunity.occupation}`);
      } catch (error) {
        logger.error(`Error creating job for ${opportunity.occupation}:`, error);
      }
    }

    // Save scan results
    await saveScanResults(workforceScan);

    // Update last scan timestamp
    await supabase.from('system_settings').upsert({
      key: 'last_nightly_scan',
      value: new Date().toISOString(),
    });

    return { success: true, gapScan, workforceScan };

  } catch (error) {
    logger.error('Nightly scan failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * On-demand gap scan for a specific program
 */
export async function scanProgramGaps(programId: string): Promise<void> {
  logger.info(`Scanning gaps for program: ${programId}`);

  try {
    // Get program details
    const { data: program } = await supabase
      .from('programs')
      .select('id, title, soc_code, credential_type')
      .eq('id', programId)
      .single();

    if (!program) {
      throw new Error(`Program not found: ${programId}`);
    }

    // Run targeted scan for this program
    const gapScan = await scanAllGaps();
    
    // Filter gaps for this program
    const programGaps = gapScan.gaps.filter(
      g => g.program_id === programId
    );

    // Create jobs for critical gaps
    for (const gap of programGaps.filter(g => g.severity === 'critical')) {
      await supabase.from('course_generation_jobs').insert({
        title: `Complete: ${program.title} - ${gap.description}`,
        occupation: program.title,
        soc_code: program.soc_code,
        credential_type: program.credential_type,
        status: 'queued',
        metadata: {
          source: 'program_scan',
          gap_type: gap.gap_type,
          program_id: programId,
        },
      });
    }

    logger.info(`Created ${programGaps.filter(g => g.severity === 'critical').length} jobs for program ${programId}`);

  } catch (error) {
    logger.error(`Error scanning program ${programId}:`, error);
    throw error;
  }
}

/**
 * Triggered when a new program is created
 */
export async function onProgramCreated(programId: string): Promise<void> {
  logger.info(`New program created: ${programId}`);
  
  // Create initial course generation job
  const { data: program } = await supabase
    .from('programs')
    .select('title, occupation, soc_code, credential_type')
    .eq('id', programId)
    .single();

  if (program) {
    await supabase.from('course_generation_jobs').insert({
      title: `Generate course for: ${program.title}`,
      occupation: program.occupation,
      soc_code: program.soc_code,
      credential_type: program.credential_type,
      status: 'queued',
      metadata: {
        source: 'program_created',
        program_id: programId,
        auto_generated: true,
      },
    });

    // Notify admin
    await supabase.from('notifications').insert({
      type: 'new_program_created',
      title: 'New Program Created',
      message: `New program "${program.title}" created. Course generation job queued.`,
      priority: 'normal',
      data: { program_id: programId },
    });
  }
}

/**
 * Triggered when a credential is updated
 */
export async function onCredentialUpdated(credentialId: string): Promise<void> {
  logger.info(`Credential updated: ${credentialId}`);
  
  // Re-scan programs using this credential
  const { data: programs } = await supabase
    .from('programs')
    .select('id')
    .eq('credential_type', credentialId);

  for (const program of programs || []) {
    await scanProgramGaps(program.id);
  }
}

/**
 * Triggered when a SOC code is added/updated
 */
export async function onSocCodeUpdated(programId: string): Promise<void> {
  logger.info(`SOC code updated for program: ${programId}`);
  
  // Fetch O*NET data and enrich program
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (program?.soc_code) {
    // This would call O*NET API and update program with additional data
    // For now, just trigger a scan
    await scanProgramGaps(programId);
  }
}

/**
 * Triggered when a course is edited or deleted
 */
export async function onCourseChanged(
  courseId: string, 
  action: 'created' | 'updated' | 'deleted'
): Promise<void> {
  logger.info(`Course ${action}: ${courseId}`);
  
  const { data: course } = await supabase
    .from('career_courses')
    .select('program_id, title')
    .eq('id', courseId)
    .single();

  if (course?.program_id) {
    if (action === 'deleted') {
      // Course was deleted, need to regenerate
      await scanProgramGaps(course.program_id);
    } else {
      // Recalculate completion score
      const { scanAllGaps } = await import('./course-gap-detection');
      await scanAllGaps(); // This will update scores
    }
  }
}

/**
 * Clean up old scan history
 * Keeps last 90 days of scans
 */
export async function cleanupScanHistory(): Promise<number> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data, error } = await supabase
    .from('workforce_scan_history')
    .delete()
    .lt('scanned_at', ninetyDaysAgo.toISOString());

  if (error) {
    logger.error('Error cleaning up scan history:', error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Get scan status and next scheduled run
 */
export async function getScanStatus(): Promise<{
  last_nightly_scan: string | null;
  next_nightly_scan: string;
  pending_jobs: number;
  active_jobs: number;
}> {
  const { data: settings } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'last_nightly_scan')
    .single();

  const lastScan = settings?.value as string | null;
  
  // Calculate next nightly scan (2:00 AM)
  const nextScan = new Date();
  if (nextScan.getHours() >= 2) {
    nextScan.setDate(nextScan.getDate() + 1);
  }
  nextScan.setHours(2, 0, 0, 0);

  const { count: pendingJobs } = await supabase
    .from('course_generation_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'queued');

  const { count: activeJobs } = await supabase
    .from('course_generation_jobs')
    .select('*', { count: 'exact', head: true })
    .in('status', ['planning', 'generating', 'saving']);

  return {
    last_nightly_scan: lastScan,
    next_nightly_scan: nextScan.toISOString(),
    pending_jobs: pendingJobs || 0,
    active_jobs: activeJobs || 0,
  };
}