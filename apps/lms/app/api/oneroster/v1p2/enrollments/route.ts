import { NextRequest, NextResponse } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { authorizeOneRoster, isOneRosterEnabled, oneRosterPagination } from '@/lib/integrations/oneroster/auth';
import { dateLastModified, oneRosterError, oneRosterStatus, oneRosterUnauthorized, oneRosterUnavailable } from '@/lib/integrations/oneroster/responses';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  if (!isOneRosterEnabled()) return oneRosterUnavailable();
  if (!(await authorizeOneRoster(request))) return oneRosterUnauthorized();

  const { limit, offset } = oneRosterPagination(request);
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('program_enrollments')
    .select('id, user_id, cohort_id, status, enrollment_date, completion_date, created_at, updated_at')
    .not('cohort_id', 'is', null)
    .order('id')
    .range(offset, offset + limit - 1);
  if (error) return oneRosterError();

  return NextResponse.json({
    enrollments: (data ?? []).map((enrollment) => ({
      sourcedId: enrollment.id,
      status: oneRosterStatus(enrollment.status),
      dateLastModified: dateLastModified(enrollment.updated_at || enrollment.created_at),
      class: { sourcedId: enrollment.cohort_id, type: 'class' },
      school: { sourcedId: process.env.ONEROSTER_ORG_SOURCED_ID || 'elevate-for-humanity', type: 'org' },
      user: { sourcedId: enrollment.user_id, type: 'user' },
      role: 'student',
      primary: true,
      beginDate: enrollment.enrollment_date || undefined,
      endDate: enrollment.completion_date || undefined,
    })),
  });
}

