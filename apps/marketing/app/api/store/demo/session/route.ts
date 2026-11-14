import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_STATE_BYTES = 40_000;
const MAX_EVENT_BYTES = 4_000;
const MAX_EVENTS = 100;

function clip(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function safeObject(value: unknown, maxBytes: number): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  try {
    const serialized = JSON.stringify(value);
    if (Buffer.byteLength(serialized, 'utf8') > maxBytes) return {};
    return JSON.parse(serialized) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function invalidSessionResponse(existing: { converted_at?: string | null; expires_at?: string | null } | null) {
  if (!existing) return NextResponse.json({ error: 'Sandbox session not found.' }, { status: 404 });
  if (existing.converted_at) {
    return NextResponse.json({ error: 'Sandbox session has already been converted.' }, { status: 409 });
  }
  if (existing.expires_at && new Date(existing.expires_at) <= new Date()) {
    return NextResponse.json({ error: 'Sandbox session expired.' }, { status: 410 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const token = clip(request.nextUrl.searchParams.get('token'), 100);
  if (!token) return NextResponse.json({ error: 'Sandbox token required.' }, { status: 400 });

  const db = await requireAdminClient();
  const { data: existing, error } = await db
    .from('demo_sales_sessions')
    .select('session_token,product_key,scenario_key,state,expires_at,converted_at')
    .eq('session_token', token)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Could not load sandbox session.' }, { status: 500 });
  const invalid = invalidSessionResponse(existing);
  if (invalid) return invalid;

  return NextResponse.json({
    demo: {
      session_token: existing!.session_token,
      product_key: existing!.product_key,
      scenario_key: existing!.scenario_key,
      state: safeObject(existing!.state, MAX_STATE_BYTES),
      expires_at: existing!.expires_at,
    },
  });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const db = await requireAdminClient();
  const body = await request.json().catch(() => ({}));
  const productKey = clip(body.productKey, 100) ?? 'platform';
  const scenarioKey = clip(body.scenarioKey, 100);
  const token = crypto.randomUUID();
  const initialState = safeObject(body.initialState, MAX_STATE_BYTES);

  const { data, error } = await db
    .from('demo_sales_sessions')
    .insert({
      session_token: token,
      product_key: productKey,
      scenario_key: scenarioKey,
      state: initialState,
      utm_source: clip(body.utmSource, 120),
      utm_medium: clip(body.utmMedium, 120),
      utm_campaign: clip(body.utmCampaign, 160),
    })
    .select('session_token,product_key,scenario_key,state,expires_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Could not start sandbox session.' }, { status: 500 });
  }

  return NextResponse.json({ demo: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const db = await requireAdminClient();
  const body = await request.json().catch(() => ({}));
  const token = clip(body.token, 100);
  if (!token) return NextResponse.json({ error: 'Sandbox token required.' }, { status: 400 });

  const { data: existing, error: lookupError } = await db
    .from('demo_sales_sessions')
    .select('id,state,events,expires_at,converted_at')
    .eq('session_token', token)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: 'Could not load sandbox session.' }, { status: 500 });
  const invalid = invalidSessionResponse(existing);
  if (invalid) return invalid;

  const statePatch = safeObject(body.state, MAX_STATE_BYTES);
  const currentState = safeObject(existing!.state, MAX_STATE_BYTES);
  const nextState = { ...currentState, ...statePatch };
  if (Buffer.byteLength(JSON.stringify(nextState), 'utf8') > MAX_STATE_BYTES) {
    return NextResponse.json({ error: 'Sandbox payload is too large.' }, { status: 413 });
  }

  const currentEvents = Array.isArray(existing!.events) ? existing!.events.slice(-MAX_EVENTS) : [];
  const eventInput = safeObject(body.event, MAX_EVENT_BYTES);
  const hasEvent = Object.keys(eventInput).length > 0;
  const nextEvents = hasEvent
    ? [...currentEvents, { ...eventInput, at: new Date().toISOString() }].slice(-MAX_EVENTS)
    : currentEvents;

  const { error } = await db
    .from('demo_sales_sessions')
    .update({
      state: nextState,
      events: nextEvents,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', existing!.id);

  if (error) return NextResponse.json({ error: 'Could not save sandbox progress.' }, { status: 500 });
  return NextResponse.json({ ok: true, state: nextState, eventCount: nextEvents.length });
}
