#!/usr/bin/env node
/**
 * Manual verification script: confirms correlation ID propagation
 * through Supabase license_events and Resend email headers.
 *
 * Usage:
 *   SITE_URL=https://www.elevateforhumanity.org \
 *   SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   RESEND_API_KEY=... \
 *   node scripts/verify-trial-correlation.mjs
 *
 * What it does:
 *   1. Triggers a trial creation via the public API
 *   2. Captures the correlationId from the response
 *   3. Queries Supabase license_events for that correlationId
 *   4. Queries Resend for the outbound email with X-Correlation-ID header
 *   5. Reports pass/fail for each hop
 *
 * NOTE: This creates a real trial. Use a test email address.
 */

const SITE_URL = process.env.SITE_URL || 'https://www.elevateforhumanity.org';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;

const TEST_EMAIL = `trial-verify-${Date.now()}@test.elevateforhumanity.org`;
const TEST_ORG = `Verify Corp ${Date.now()}`;
const TEST_NAME = 'Verification Bot';

async function main() {
  console.log('=== Trial Correlation Verification ===\n');

  // Check prerequisites
  const missing = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!RESEND_KEY) missing.push('RESEND_API_KEY');

  if (missing.length > 0) {
    console.log(`⚠️  Missing env vars: ${missing.join(', ')}`);
    console.log('   Some verification steps will be skipped.\n');
  }

  // Step 1: Create trial
  console.log(`1. Creating trial via ${SITE_URL}/api/trial/start-managed`);
  console.log(`   Email: ${TEST_EMAIL}`);

  const res = await fetch(`${SITE_URL}/api/trial/start-managed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgName: TEST_ORG,
      adminName: TEST_NAME,
      adminEmail: TEST_EMAIL,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.log(`   ❌ API returned ${res.status}: ${data.error}`);
    if (data.correlationId) {
      console.log(`   correlationId: ${data.correlationId}`);
    }
    // If it's a 503 (Supabase not configured), we can still verify the correlation ID was generated
    if (data.correlationId) {
      console.log('\n   ✅ HOP 1: correlationId present in error response');
    } else {
      console.log('\n   ❌ HOP 1: correlationId missing from error response');
    }
    process.exit(1);
  }

  const { correlationId, subdomain, tenantUrl } = data;
  console.log(`   ✅ Trial created: ${subdomain}`);
  console.log(`   correlationId: ${correlationId}\n`);

  if (!correlationId) {
    console.log('   ❌ HOP 1: correlationId missing from success response');
    process.exit(1);
  }
  console.log('   ✅ HOP 1: correlationId in API response\n');

  // Step 2: Check Supabase license_events
  if (SUPABASE_URL && SUPABASE_KEY) {
    console.log('2. Checking Supabase license_events...');
    const eventRes = await fetch(
      `${SUPABASE_URL}/rest/v1/license_events?event_data->>correlation_id=eq.${correlationId}&select=id,event_type,event_data,created_at&limit=5`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const events = await eventRes.json();

    if (Array.isArray(events) && events.length > 0) {
      console.log(`   ✅ HOP 2: Found ${events.length} event(s) with correlationId in license_events`);
      for (const e of events) {
        console.log(`     - ${e.event_type} at ${e.created_at}`);
      }
    } else {
      console.log('   ❌ HOP 2: No events found with this correlationId in license_events');
    }
  } else {
    console.log('2. ⏭️  Skipping Supabase check (no credentials)');
  }

  console.log('');

  // Step 3: Check Resend for email with correlation header
  if (RESEND_KEY) {
    console.log('3. Checking Resend for outbound email...');
    // Resend API: list emails
    const emailRes = await fetch('https://api.resend.com/emails', {
      headers: { Authorization: `Bearer ${RESEND_KEY}` },
    });
    const emails = await emailRes.json();

    if (emails?.data) {
      const match = emails.data.find(e => e.to?.includes(TEST_EMAIL));
      if (match) {
        console.log(`   ✅ HOP 3: Email sent to ${TEST_EMAIL} (id: ${match.id})`);
        console.log('   Note: X-Correlation-ID header verification requires Resend webhook or manual check in Resend dashboard.');
      } else {
        console.log(`   ⚠️  HOP 3: No email found for ${TEST_EMAIL} yet (may take a few seconds)`);
      }
    } else {
      console.log('   ⚠️  HOP 3: Could not query Resend emails');
    }
  } else {
    console.log('3. ⏭️  Skipping Resend check (no RESEND_API_KEY)');
  }

  console.log('\n=== Verification Complete ===');
  console.log(`correlationId: ${correlationId}`);
  console.log(`Use this ID to search in GA4 DebugView, Supabase, and Resend.`);
}

main().catch(err => {
  console.error('Verification failed:', err.message);
  process.exit(1);
});
