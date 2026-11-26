/**
 * /api/admin/integrations/calendly
 *
 * Backs the Calendly integration page (/integrations/calendly).
 * Thin admin proxy over the Calendly API v2 using the Personal Access
 * Token stored in app_secrets (key CALENDLY_PAT, service-role only).
 *
 * GET  ?action=status | event_types | scheduled_events | webhooks
 * POST { action: 'create_webhook' } | { action: 'delete_webhook', webhookUuid }
 *
 * NOTE: create_webhook registers the platform callback URL
 * (https://www.elevateforhumanity.org/api/webhooks/calendly). No receiver
 * route exists for that path yet — subscriptions can be created and
 * inspected here, but deliveries need the receiver built.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALENDLY_API = 'https://api.calendly.com';
const WEBHOOK_CALLBACK = 'https://www.elevateforhumanity.org/api/webhooks/calendly';

async function guard() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: safeError('Unauthorized', 401) };
  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: safeError('Forbidden', 403) };
  }
  return { db, user };
}

async function calendlyToken(db: Awaited<ReturnType<typeof requireAdminClient>>) {
  const { data } = await db
    .from('app_secrets')
    .select('value')
    .eq('key', 'CALENDLY_PAT')
    .maybeSingle();
  const value = data?.value?.trim();
  if (!value || value === '<CALENDLY_PAT>') return null;
  return value;
}

async function calendly(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${CALENDLY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      `Calendly API ${res.status}: ${String(data.message ?? data.title ?? 'request failed')}`,
    );
  }
  return data;
}

async function meAndOrg(token: string) {
  const me = await calendly(token, '/users/me');
  const resource = (me.resource ?? {}) as Record<string, string>;
  return { resource, org: resource.current_organization ?? '' };
}

export async function GET(request: NextRequest) {
  const g = await guard();
  if ('error' in g) return g.error;
  const action = request.nextUrl.searchParams.get('action') ?? 'status';

  const token = await calendlyToken(g.db);
  if (!token) {
    if (action === 'status') {
      return NextResponse.json({ connected: false, error: 'Calendly token not configured' });
    }
    return NextResponse.json({ error: 'Calendly token not configured' }, { status: 503 });
  }

  try {
    const { resource, org } = await meAndOrg(token);
    switch (action) {
      case 'status':
        return NextResponse.json({
          connected: true,
          name: resource.name,
          email: resource.email,
          scheduling_url: resource.scheduling_url,
          timezone: resource.timezone,
        });
      case 'event_types': {
        const d = await calendly(token, `/event_types?organization=${encodeURIComponent(org)}&count=100`);
        return NextResponse.json({ event_types: d.collection ?? [] });
      }
      case 'scheduled_events': {
        const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
        const d = await calendly(
          token,
          `/scheduled_events?organization=${encodeURIComponent(org)}&min_start_time=${encodeURIComponent(since)}&count=100&sort=start_time:desc`,
        );
        return NextResponse.json({ events: d.collection ?? [] });
      }
      case 'webhooks': {
        const d = await calendly(
          token,
          `/webhook_subscriptions?organization=${encodeURIComponent(org)}&scope=organization&count=100`,
        );
        return NextResponse.json({ webhooks: d.collection ?? [] });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Calendly request failed';
    if (action === 'status') return NextResponse.json({ connected: false, error: message });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const g = await guard();
  if ('error' in g) return g.error;

  const token = await calendlyToken(g.db);
  if (!token) return NextResponse.json({ error: 'Calendly token not configured' }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    webhookUuid?: string;
  };
  try {
    const { org } = await meAndOrg(token);
    if (body.action === 'create_webhook') {
      const d = await calendly(token, '/webhook_subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          url: WEBHOOK_CALLBACK,
          events: ['invitee.created', 'invitee.canceled'],
          organization: org,
          scope: 'organization',
        }),
      });
      return NextResponse.json({ ok: true, webhook: d.resource ?? null });
    }
    if (body.action === 'delete_webhook') {
      if (!body.webhookUuid) return safeError('webhookUuid is required', 400);
      await calendly(token, `/webhook_subscriptions/${encodeURIComponent(body.webhookUuid)}`, {
        method: 'DELETE',
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Calendly request failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
