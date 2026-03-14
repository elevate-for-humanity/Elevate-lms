// Netlify scheduled function: compliance expiration notifications
// Schedule: every Monday at 08:00 UTC (3 AM ET)
// Calls the Next.js API route which handles the actual logic.
// Protected by CRON_SECRET — set this in Netlify site settings.

import type { Config } from '@netlify/functions';

export default async function handler() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
  const cronSecret = process.env.CRON_SECRET;

  const res = await fetch(`${siteUrl}/api/cron/compliance-expiration`, {
    method: 'GET',
    headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('[cron-compliance-expiration] API returned', res.status, body);
    return { statusCode: res.status };
  }

  console.log('[cron-compliance-expiration] done', body);
  return { statusCode: 200 };
}

export const config: Config = {
  schedule: '0 8 * * 1',
};
