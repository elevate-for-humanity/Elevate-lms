import type { Config, Context } from '@netlify/functions';

/**
 * Scheduled function: daily audit log export to Supabase Storage.
 * Runs at 02:00 UTC daily.
 *
 * Calls the /api/admin/audit-export endpoint which:
 * 1. Snapshots new audit_logs rows since last export
 * 2. Writes JSONL to Supabase Storage (audit-archive bucket)
 * 3. Records export metadata with checksum
 */
export default async function handler(req: Request, context: Context) {
  const siteUrl = process.env.URL || process.env.DEPLOY_URL || 'https://www.elevateforhumanity.org';
  const internalSecret = process.env.INTERNAL_CRON_SECRET;

  if (!internalSecret) {
    console.error('[audit-export-cron] INTERNAL_CRON_SECRET not set');
    return new Response('Not configured', { status: 500 });
  }

  try {
    const response = await fetch(`${siteUrl}/api/admin/audit-export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${internalSecret}`,
      },
    });

    const result = await response.json();
    console.log('[audit-export-cron] Result:', JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[audit-export-cron] Failed:', error);
    return new Response('Export failed', { status: 500 });
  }
}

export const config: Config = {
  schedule: '20 * * * *', // Hourly at :20 past (after DB snapshot at :15)
};
