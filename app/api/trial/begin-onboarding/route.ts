// PUBLIC ROUTE: trial onboarding form
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * POST /api/trial/begin-onboarding
 *
 * Called when a trial user clicks "Open Dashboard & Configure."
 * Records onboarding initiation so we can distinguish between
 * "trial created but never opened" and "trial created and user engaged."
 *
 * Body: { subdomain, correlationId? }
 * Also accepts x-correlation-id header.
 */
async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => ({}));
  const correlationId: string =
    body.correlationId ||
    request.headers.get('x-correlation-id') ||
    `onboard_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const { subdomain } = body;

    if (!subdomain || typeof subdomain !== 'string') {
      return NextResponse.json({ error: 'subdomain is required', correlationId }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      logger.error(`[trial/begin-onboarding] ${correlationId} — Supabase not configured`);
      return NextResponse.json({ error: 'Service unavailable', correlationId }, { status: 503 });
    }

    // Find the org by slug
    const { data: org } = await supabase
      .from('organizations')
      .select('id, onboarding_started_at')
      .eq('slug', subdomain)
      .maybeSingle();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found', correlationId }, { status: 404 });
    }

    // Only set onboarding_started_at once (idempotent)
    if (!org.onboarding_started_at) {
      await supabase
        .from('organizations')
        .update({ onboarding_started_at: new Date().toISOString() })
        .eq('id', org.id);
    }

    // Log the event with correlation ID for end-to-end tracing
    const { data: license } = await supabase
      .from('licenses')
      .select('id')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (license) {
      await supabase.from('license_events').insert({
        license_id: license.id,
        organization_id: org.id,
        event_type: 'trial_onboarding_started',
        event_data: {
          correlation_id: correlationId,
          subdomain,
          source: 'trial_success_page',
        },
      }).catch(() => {}); // Non-critical
    }

    return NextResponse.json({ ok: true, correlationId });
  } catch (error) {
    logger.error(`[trial/begin-onboarding] ${correlationId} — Unexpected error:`, error);
    return NextResponse.json({ error: 'Internal server error', correlationId }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/trial/begin-onboarding', _POST);
