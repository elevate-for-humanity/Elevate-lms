import type { Config } from '@netlify/functions';

/**
 * Scheduled function: runs daily at 9 AM ET (1 PM UTC).
 * Calls the onboarding follow-up API route to resend emails
 * to applicants who haven't responded within 24 hours.
 */
export default async () => {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const cronSecret = process.env.CRON_SECRET || '';

  const resp = await fetch(`${siteUrl}/api/cron/onboarding-followup`, {
    method: 'GET',
    headers: {
      ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
    },
  });

  const data = await resp.json();
  console.log('[Onboarding Follow-up]', JSON.stringify(data));

  return new Response(JSON.stringify(data), { status: resp.status });
};

export const config: Config = {
  schedule: '0 13 * * *', // Daily at 1 PM UTC = 9 AM ET
};
