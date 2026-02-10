import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authGuards';
import { withAuth } from '@/lib/with-auth';
import { createClient } from '@supabase/supabase-js';

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
 * Returns recent license_events filtered to trial-related event types.
 *
 * Query params:
 *   ?days=7        — lookback window (default 7, max 90)
 *   ?type=failed   — filter: "all" | "failed" | "started" | "onboarding"
 *   ?limit=50      — max rows (default 50, max 200)
 */
export const GET = withAuth(
  async (request: NextRequest) => {
    try {
      await requireAdmin();

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

      let query = supabase
        .from('license_events')
        .select('id, license_id, organization_id, event_type, event_data, created_at')
        .in('event_type', eventTypes)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: events, error } = await query;

      if (error) {
        console.error('[admin/trial-events] Query error:', error);
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

      return NextResponse.json({ summary, events });
    } catch (error) {
      console.error('[admin/trial-events] Unexpected error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
