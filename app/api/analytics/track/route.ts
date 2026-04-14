// POST /api/analytics/track
// Receives page views, web vitals, and custom events from SelfHostedAnalytics.
// Stores in the analytics_events table. Silently accepts unknown event shapes.

// PUBLIC ROUTE: anonymous page-view tracking — no auth required

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await getAdminClient();
  if (!supabase) {
    // Non-fatal — analytics must never break the app
    return NextResponse.json({ ok: true });
  }

  try {
    await supabase.from('analytics_events').insert({
      event: body.event ?? 'unknown',
      path: body.path ?? null,
      referrer: body.referrer ?? null,
      user_agent: body.user_agent ?? null,
      screen_width: body.screen_width ?? null,
      screen_height: body.screen_height ?? null,
      metric_name: body.metric_name ?? null,
      metric_value: body.metric_value ?? null,
      metric_id: body.metric_id ?? null,
      properties: body.properties ?? null,
      recorded_at: body.timestamp ?? new Date().toISOString(),
    });
  } catch {
    // Non-fatal — table may not exist yet; never break the caller
  }

  return NextResponse.json({ ok: true });
}
