// pre-auth-registry: exempt - requireRole verifies a phone-manager role;
// every failure is mapped to a JSON 403 here instead of a page redirect,
// because this is a JSON API. The probe itself never throws.
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PHONE_MANAGER_ROLES } from '@/lib/phone/access';
import { hydrateProcessEnv } from '@/lib/secrets';
import { probePhoneReadiness } from '@/lib/phone/readiness-probe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/communications/phone/readiness
 *
 * Server-side, time-bounded phone readiness (issue #2166). Returns the
 * live evaluation — Twilio account + primary voice number, PBX
 * configuration + PBX-verified SIP registrations, call history, and the
 * explicitly-unverified call-test / meetings / voice-webhook checks.
 * `ready: true` requires all of Twilio, PBX config, and a SIP
 * registration verified by Asterisk within the last 120 seconds.
 * A failed or stale probe is reported as unverified, never as ready.
 * No secrets or caller PII are included in the response.
 */
export async function GET() {
  try {
    await requireRole(PHONE_MANAGER_ROLES);
  } catch {
    return NextResponse.json(
      { error: 'Phone readiness is only available to phone managers.' },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
  try {
    await hydrateProcessEnv();
    const db = await requireAdminClient();
    const readiness = await probePhoneReadiness(db);
    return NextResponse.json(readiness, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    // The probe itself never throws; this is the DB/auth fallback.
    return NextResponse.json(
      { error: 'Phone readiness is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
