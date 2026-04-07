// Netlify scheduled function: pre-auth orphan detection
// Schedule: daily at 06:00 UTC
//
// Calls /api/internal/orphan-check which queries all tables in PRE_AUTH_TABLES
// (lib/pre-auth-tables.ts) for rows with user_id IS NULL that have a matching
// profile — meaning a real user cannot see their own data.
//
// Response codes:
//   200 — all tables clean
//   207 — ACTION_REQUIRED: linkable orphaned rows exist, check logs
//
// Protected by CRON_SECRET — set this in Netlify site settings.

import type { Config } from '@netlify/functions';

export default async function handler() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[cron-orphan-check] CRON_SECRET not set — aborting');
    return { statusCode: 500 };
  }

  const res = await fetch(
    `${siteUrl}/api/internal/orphan-check?secret=${encodeURIComponent(cronSecret)}`,
    { method: 'GET' },
  );

  const body = await res.json().catch(() => ({}));

  if (res.status === 207) {
    // ACTION_REQUIRED — linkable orphaned rows detected
    console.error('[cron-orphan-check] ACTION REQUIRED — orphaned rows with matching profiles:', JSON.stringify(body, null, 2));
    // Still return 200 to Netlify so the function is not marked as failed
    // (failure would suppress future runs). The error is in the logs.
    return { statusCode: 200 };
  }

  if (!res.ok) {
    console.error('[cron-orphan-check] unexpected error', res.status, body);
    return { statusCode: res.status };
  }

  console.log('[cron-orphan-check] all pre-auth tables clean', body);
  return { statusCode: 200 };
}

export const config: Config = {
  schedule: '0 6 * * *',
};
