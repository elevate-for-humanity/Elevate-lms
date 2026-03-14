import type { Config, Context } from '@netlify/functions';
import { hydrateProcessEnv } from '../lib/secrets-standalone.js';

/**
 * Scheduled function: process pending background jobs every 5 minutes.
 *
 * Calls /api/jobs/process which:
 * 1. Claims up to 25 pending job_queue rows
 * 2. Executes each job (certificate email, notification)
 * 3. Marks completed or schedules retry on failure
 * 4. After 5 failed attempts: marks status='failed' for admin review
 *
 * Failed jobs are visible at /admin/system/jobs.
 */
export default async function handler(req: Request, context: Context) {
  await hydrateProcessEnv();

  const siteUrl = process.env.URL || process.env.DEPLOY_URL || 'https://www.elevateforhumanity.org';
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[job-processor] CRON_SECRET not set');
    return new Response('Not configured', { status: 500 });
  }

  try {
    const response = await fetch(`${siteUrl}/api/jobs/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`,
      },
    });

    const body = await response.text();

    if (!response.ok) {
      console.error(`[job-processor] Processor returned ${response.status}: ${body}`);
      return new Response(`Processor error: ${response.status}`, { status: 500 });
    }

    console.log(`[job-processor] Done: ${body}`);
    return new Response(body, { status: 200 });
  } catch (err) {
    console.error('[job-processor] Fetch failed:', err);
    return new Response('Internal error', { status: 500 });
  }
}

export const config: Config = {
  // Every 5 minutes
  schedule: '*/5 * * * *',
};
