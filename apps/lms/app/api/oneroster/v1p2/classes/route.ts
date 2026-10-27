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
    .from('cohorts')
    .select('id, program_id, code, name, cohort_name, status, updated_at')
    .order('id')
    .range(offset, offset + limit - 1);
  if (error) return oneRosterError();

  return NextResponse.json({
    classes: (data ?? []).map((cohort) => ({
      sourcedId: cohort.id,
      status: oneRosterStatus(cohort.status),
      dateLastModified: dateLastModified(cohort.updated_at),
      title: cohort.cohort_name || cohort.name || cohort.code,
      classCode: cohort.code,
      classType: 'scheduled',
      course: cohort.program_id ? { sourcedId: cohort.program_id, type: 'course' } : undefined,
      school: { sourcedId: process.env.ONEROSTER_ORG_SOURCED_ID || 'elevate-for-humanity', type: 'org' },
      terms: [],
      subjects: [],
      subjectCodes: [],
      periods: [],
    })),
  });
}

