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
  const { data: enrollments, error: enrollmentError } = await db
    .from('program_enrollments')
    .select('user_id')
    .not('cohort_id', 'is', null)
    .in('status', ['active', 'completed'])
    .order('user_id')
    .range(offset, offset + limit - 1);
  if (enrollmentError) return oneRosterError();

  const ids = [...new Set((enrollments ?? []).map((item) => item.user_id).filter(Boolean))] as string[];
  const { data: profiles, error } = ids.length
    ? await db.from('profiles').select('id, email, first_name, last_name, role, updated_at').in('id', ids)
    : { data: [], error: null };
  if (error) return oneRosterError();

  return NextResponse.json({
    users: (profiles ?? []).map((profile) => ({
      sourcedId: profile.id,
      status: 'active',
      dateLastModified: dateLastModified(profile.updated_at),
      enabledUser: true,
      username: profile.email,
      givenName: profile.first_name || '',
      familyName: profile.last_name || '',
      role: profile.role === 'instructor' ? 'teacher' : 'student',
      email: profile.email,
      orgs: [{ sourcedId: process.env.ONEROSTER_ORG_SOURCED_ID || 'elevate-for-humanity', type: 'org' }],
    })),
  });
}

