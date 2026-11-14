import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import {
  getHubSpotFreeCrmStatus,
  upsertHubSpotFreeContact,
} from '@/lib/integrations/hubspot/free-crm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function POST(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const status = getHubSpotFreeCrmStatus();
  if (!status.enabled) {
    return NextResponse.json(
      { ok: false, error: 'HubSpot sync is disabled', hubspot: status },
      { status: 409 },
    );
  }
  if (!status.configured) {
    return NextResponse.json(
      { ok: false, error: 'HubSpot runtime credential is not configured', hubspot: status },
      { status: 503 },
    );
  }

  let body: { applicationId?: string };
  try {
    body = (await request.json()) as { applicationId?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const applicationId = body.applicationId?.trim();
  if (!applicationId) {
    return NextResponse.json({ ok: false, error: 'applicationId is required' }, { status: 400 });
  }

  const supabase = await getAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  const { data: application, error } = await supabase
    .from('applications')
    .select('id, email, first_name, last_name, phone, city, state, zip')
    .eq('id', applicationId)
    .maybeSingle();

  if (error) {
    logger.warn('[hubspot/sync-application] application lookup failed', {
      applicationId,
      error: error.message,
    });
    return NextResponse.json({ ok: false, error: 'Application lookup failed' }, { status: 500 });
  }

  if (!application) {
    return NextResponse.json({ ok: false, error: 'Application not found' }, { status: 404 });
  }

  const result = await upsertHubSpotFreeContact({
    email: application.email || '',
    firstName: application.first_name,
    lastName: application.last_name,
    phone: application.phone,
    city: application.city,
    state: application.state,
    zip: application.zip,
  });

  if ('error' in result) {
    return NextResponse.json(
      { ok: false, error: result.error, hubspotStatus: result.status },
      { status: 502 },
    );
  }

  if (result.skipped) {
    return NextResponse.json({
      ok: true,
      applicationId,
      skipped: true,
      reason: result.reason,
    });
  }

  return NextResponse.json({
    ok: true,
    applicationId,
    contactId: 'contactId' in result ? result.contactId : undefined,
    skipped: false,
  });
}
