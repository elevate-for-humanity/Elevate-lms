import { NextRequest, NextResponse } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { authorizeOneRoster, isOneRosterEnabled, oneRosterPagination } from '@/lib/integrations/oneroster/auth';
import { dateLastModified, oneRosterError, oneRosterUnauthorized, oneRosterUnavailable } from '@/lib/integrations/oneroster/responses';
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
  // OneRoster's course is the catalog parent of a scheduled class. In Elevate,
  // cohorts belong to programs, so programs are the referentially-correct
  // projection here. Curriculum courses remain internal children of a program.
  const { data, error } = await db
    .from('programs')
    .select('id, title, name, slug, updated_at')
    .eq('is_active', true)
    .order('id')
    .range(offset, offset + limit - 1);
  if (error) return oneRosterError();

  return NextResponse.json({
    courses: (data ?? []).map((course) => ({
      sourcedId: course.id,
      status: 'active',
      dateLastModified: dateLastModified(course.updated_at),
      title: course.title || course.name || course.slug,
      courseCode: course.slug,
      org: { sourcedId: process.env.ONEROSTER_ORG_SOURCED_ID || 'elevate-for-humanity', type: 'org' },
    })),
  });
}
