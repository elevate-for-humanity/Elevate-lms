/**
 * Calendly admin integration API.
 * GET ?action=status|event_types|scheduled_events|webhooks
 * POST { action: 'create_webhook' | 'delete_webhook', webhookUri?, webhookUuid? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALENDLY_BASE = 'https://api.calendly.com';

function getToken(): string {
  return process.env.CALENDLY_API_TOKEN ?? '';
}

async function calendlyFetch(path: string, options?: RequestInit) {
  const token = getToken();
  if (!token) throw new Error('CALENDLY_API_TOKEN not configured');
  const res = await fetch(`${CALENDLY_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Calendly API ${res.status}: ${text}`);
  }
  return res.json();
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const action = request.nextUrl.searchParams.get('action') ?? 'status';
  const token = getToken();

  if (!token) {
    return NextResponse.json({
      connected: false,
      error: 'CALENDLY_API_TOKEN not configured',
    });
  }

  try {
    if (action === 'status') {
      // Fetch current user info to verify token
      const data = await calendlyFetch('/users/me');
      const user = data?.resource;
      return NextResponse.json({
        connected: true,
        user_uuid: user?.uri?.split('/').pop() ?? '',
        name: user?.name ?? '',
        email: user?.email ?? '',
        organization: user?.current_organization ?? '',
        scheduling_url: user?.scheduling_url ?? '',
        timezone: user?.timezone ?? '',
      });
    }

    if (action === 'event_types') {
      // Get user URI first
      const me = await calendlyFetch('/users/me');
      const userUri = me?.resource?.uri;
      const orgUri = me?.resource?.current_organization;
      const data = await calendlyFetch(
        `/event_types?user=${encodeURIComponent(userUri)}&organization=${encodeURIComponent(orgUri)}&active=true&count=50`,
      );
      return NextResponse.json({ event_types: data?.collection ?? [] });
    }

    if (action === 'scheduled_events') {
      const me = await calendlyFetch('/users/me');
      const userUri = me?.resource?.uri;
      const orgUri = me?.resource?.current_organization;
      const minTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const data = await calendlyFetch(
        `/scheduled_events?user=${encodeURIComponent(userUri)}&organization=${encodeURIComponent(orgUri)}&min_start_time=${minTime}&count=50&sort=start_time:desc`,
      );
      return NextResponse.json({ events: data?.collection ?? [], pagination: data?.pagination });
    }

    if (action === 'webhooks') {
      const me = await calendlyFetch('/users/me');
      const orgUri = me?.resource?.current_organization;
      const data = await calendlyFetch(
        `/webhook_subscriptions?organization=${encodeURIComponent(orgUri)}&scope=organization&count=20`,
      );
      return NextResponse.json({ webhooks: data?.collection ?? [] });
    }

    return safeError('Unknown action', 400);
  } catch (err) {
    logger.error('[calendly admin] GET failed', err);
    return safeInternalError(err, 'Calendly API request failed');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  const { action, webhookUri, webhookUuid } = body;

  try {
    if (action === 'create_webhook') {
      const callbackUrl =
        webhookUri ??
        `${process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl}/api/chatbot/calendly-webhook`;

      const me = await calendlyFetch('/users/me');
      const orgUri = me?.resource?.current_organization;
      const userUri = me?.resource?.uri;

      const data = await calendlyFetch('/webhook_subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          url: callbackUrl,
          events: ['invitee.created', 'invitee.canceled'],
          organization: orgUri,
          user: userUri,
          scope: 'organization',
          signing_key: process.env.CALENDLY_WEBHOOK_SECRET ?? undefined,
        }),
      });
      return NextResponse.json({ success: true, webhook: data?.resource });
    }

    if (action === 'delete_webhook') {
      if (!webhookUuid) return safeError('webhookUuid required', 400);
      await calendlyFetch(`/webhook_subscriptions/${webhookUuid}`, { method: 'DELETE' });
      return NextResponse.json({ success: true, message: 'Webhook deleted' });
    }

    return safeError('Unknown action', 400);
  } catch (err) {
    logger.error('[calendly admin] POST failed', err);
    return safeInternalError(err, 'Calendly API request failed');
  }
}
