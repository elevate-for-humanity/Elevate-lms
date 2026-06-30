/**
 * GET /api/applications/[id]/verify
 *
 * Lightweight check: confirms an application exists and is in a payable state
 * before showing the payment page. Public — no auth required (application ID
 * is a UUID and acts as a bearer token for this read-only check).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAYABLE_STATUSES = ['pending', 'approved', 'ready_to_enroll', 'submitted'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
  }

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('applications')
      .select('id, status, program_interest, first_name')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!PAYABLE_STATUSES.includes(data.status)) {
      return NextResponse.json(
        { error: `Application status "${data.status}" is not eligible for payment` },
        { status: 409 },
      );
    }

    return NextResponse.json({
      valid: true,
      applicationId: data.id,
      programInterest: data.program_interest,
      firstName: data.first_name,
    });
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
