// GET /api/certification/pathways?program_id=<uuid>
//
// Returns available certification pathways for a program.
// Used by the student dashboard to show pathway selection after training completion.
// Public-facing data — no sensitive fields returned.

import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { getAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);

  const programId = request.nextUrl.searchParams.get('program_id');
  if (!programId) return safeError('program_id required', 400);

  try {
    const db = await getAdminClient();
    if (!db) return safeError('Database unavailable', 503);

    const { data: pathways, error } = await db
      .from('program_certification_pathways')
      .select(`
        id,
        credential_name,
        credential_abbreviation,
        eligibility_review_required,
        application_url,
        exam_fee_cents,
        fee_payer,
        state_scope,
        coverage_note,
        is_primary,
        sort_order,
        certification_bodies (
          id,
          name,
          abbreviation,
          website,
          application_url,
          state
        ),
        credential_registry (
          id,
          name,
          abbreviation,
          description,
          renewal_period_months
        )
      `)
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) return safeError('Failed to load pathways', 500);

    // Also return the student's existing certification request for this program
    // so the dashboard knows if they've already selected a pathway
    const { data: existingRequest } = await db
      .from('certification_requests')
      .select('id, status, pathway_id, credential_name')
      .eq('user_id', auth.id)
      .eq('program_id', programId)
      .maybeSingle();

    return NextResponse.json({
      pathways: pathways ?? [],
      existing_request: existingRequest ?? null,
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to load certification pathways');
  }
}
