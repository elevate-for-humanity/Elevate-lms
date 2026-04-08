// Netlify scheduled function: testing appointment reminders
// Schedule: every hour (fires 24hr and 1hr reminders within a ~60min window)
//
// Calls /api/internal/testing-reminders which queries testing_appointment_reminders
// for unsent rows where send_at <= now() and fires email + SMS to each invitee.
//
// Protected by CRON_SECRET — set this in Netlify site settings.

import type { Config } from '@netlify/functions';

export default async function handler() {
  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not set — skipping testing reminders');
    return;
  }

  const url = `${siteUrl}/api/internal/testing-reminders`;

  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'x-cron-secret': cronSecret },
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('Testing reminders cron failed', res.status, body);
      return;
    }

    console.log('Testing reminders cron complete', body);
  } catch (err) {
    console.error('Testing reminders cron error', err);
  }
}

export const config: Config = {
  schedule: '0 * * * *', // every hour
};
