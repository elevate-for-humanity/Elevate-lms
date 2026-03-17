/**
 * POST /api/case-manager/placements
 * Create a placement record for a participant.
 * Auth: case_manager, admin, super_admin, staff.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const ALLOWED_ROLES = ['case_manager', 'admin', 'super_admin', 'staff'];

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return safeError('Unauthorized', 401);

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!ALLOWED_ROLES.includes(profile?.role ?? '')) {
    return safeError('Forbidden', 403);
  }

  let body: any;
  try { body = await request.json(); }
  catch { return safeError('Invalid JSON', 400); }

  const {
    learner_id, employer_name, job_title, employment_type,
    hourly_wage, start_date, verification_method, notes, status,
  } = body;

  if (!learner_id) return safeError('learner_id is required', 400);

  try {
    const { data, error } = await db
      .from('placement_records')
      .insert({
        learner_id,
        case_manager_id:     user.id,
        employer_name:       employer_name ?? null,
        job_title:           job_title ?? null,
        employment_type:     employment_type ?? null,
        hourly_wage:         hourly_wage ?? null,
        start_date:          start_date ?? null,
        verification_method: verification_method ?? null,
        notes:               notes ?? null,
        status:              status ?? 'pending',
      })
      .select('id')
      .single();

    if (error) return safeInternalError(error, 'POST /api/case-manager/placements');

    return NextResponse.json({ placement: data }, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'POST /api/case-manager/placements');
  }
}
