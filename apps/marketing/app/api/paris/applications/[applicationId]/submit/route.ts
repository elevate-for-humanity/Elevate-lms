import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

/**
 * Compatibility submit endpoint.
 *
 * Canonical /api/applications creates a submitted application immediately. Older
 * PARIS clients may still call this endpoint after creation, so make that call
 * an ownership-checked idempotent read instead of attempting to transition a
 * retired paris_applications state machine.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = createPublicClient();
    const { data: { user }, error: authError } = await auth.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid authentication' }, { status: 401 });
    }

    const { applicationId } = await context.params;
    const db = await requireAdminClient();
    const { data: application, error } = await db
      .from('applications')
      .select('id, reference_number, status, user_id')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !application) {
      return NextResponse.json({ success: false, error: 'Application not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      workflowStatus: application.status,
      applicationNumber: application.reference_number,
      redirectTo: `/apply/track?id=${encodeURIComponent(application.reference_number || application.id)}`,
      canonicalAuthority: 'applications',
      alreadySubmitted: true,
    });
  } catch (error) {
    console.error('paris.application.compat.submit.failed', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, error: 'Unable to load submitted application' }, { status: 400 });
  }
}
