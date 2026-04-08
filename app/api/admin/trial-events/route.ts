import { requireAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { createClient } from '@supabase/supabase-js';
import { withApiAudit } from '@/lib/audit/withApiAudit';

import { withRuntime } from '@/lib/api/withRuntime';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /api/admin/trial-events
 *
 * Admin-only endpoint for reviewing trial funnel events.
 * Auth: withAuth verifies session cookie + role='admin' via Supabase.
 * Non-admin authenticated users get 403. Unauthenticated users get 401.
 *
 * Query params:
 *   ?days=7        — lookback window (default 7, max 90)
 *   ?type=failed   — filter: "all" | "failed" | "started" | "onboarding"
 *   ?limit=50      — max rows (default 50, max 200)
 */
const _GET = withAuth(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const days = Math.min(parseInt(searchParams.get('days') || '7', 10) || 7, 90);
      const type = searchParams.get('type') || 'all';
      const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200);

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }

      const since = new Date();
      since.setDate(since.getDate() - days);

      // Map filter type to event_type patterns
      const eventTypeFilters: Record<string, string[]> = {
        all: [
          'trial_self_service_start',
          'trial_onboarding_started',
          'trial_onboarding_reconciled',
        ],
        started: ['trial_self_service_start'],
        onboarding: ['trial_onboarding_started', 'trial_onboarding_reconciled'],
      };

      const eventTypes = eventTypeFilters[type] || eventTypeFilters.all;

      const query = db
        .from('license_events')
        .select('id, license_id, organization_id, event_type, event_data, created_at')
        .in('event_type', eventTypes)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: events, error } = await query;

      if (error) {
        logger.error('[admin/trial-events] Query error:', error);
        return NextResponse.json({ error: 'Failed to query events' }, { status: 500 });
      }

      // Compute summary stats
      const summary = {
        total: events?.length || 0,
        by_type: {} as Record<string, number>,
        lookback_days: days,
      };

      for (const event of events || []) {
        summary.by_type[event.event_type] = (summary.by_type[event.event_type] || 0) + 1;
      }

      // Surface setup warnings so operators see what's missing
      const setup_warnings: string[] = [];
      if (!process.env.SENDGRID_API_KEY) {
        setup_warnings.push('SENDGRID_API_KEY not configured — trial welcome emails are not being sent');
      }
      if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
        setup_warnings.push('GA4 measurement ID not configured — client-side funnel analytics are not recording');
      }
      // GA4 custom dimension can't be verified programmatically — always remind
      setup_warnings.push(
        'Verify GA4 custom dimension: Admin → Custom definitions → Event-scoped → "correlation_id". Without this, correlation IDs appear in DebugView but not in reports.'
      );

      return NextResponse.json({ summary, setup_warnings, events });
    } catch (error) {
      logger.error('[admin/trial-events] Unexpected error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['admin'] }
);
export const GET = withRuntime(withApiAudit('/api/admin/trial-events', _GET));
