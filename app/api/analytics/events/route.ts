export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/analytics/events/route.ts
// Track user activity events
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from "@/lib/supabase-api";


export async function POST(req: NextRequest) {
  const supabase = createSupabaseClient();
  const { tenantId, userId, eventType, payload, path } = await req.json();

  if (!eventType || !tenantId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                    req.headers.get('x-real-ip') ||
                    null;
  const userAgent = req.headers.get('user-agent') || null;
  const referrer = req.headers.get('referer') || null;

  await supabase.from('user_activity_events').insert({
    tenant_id: tenantId,
    user_id: userId,
    event_type: eventType,
    event_payload: payload || {},
    path,
    referrer,
    user_agent: userAgent,
    ip_address: ipAddress
  });

  return NextResponse.json({ status: 'ok' });
}
