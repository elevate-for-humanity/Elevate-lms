/**
 * GET /api/org/reports
 *
 * Returns org-scoped progress summary, optionally filtered by cohort,
 * program, date range, or credential status.
 *
 * Auth: org_admin or org_owner (enforced via requireOrgAccess).
 * Org is resolved from the session user's profile.organization_id via
 * getOrgContext, then passed to requireOrgAccess for the role check.
 *
 * Query params:
 *   cohortId          (optional)
 *   programId         (optional)
 *   dateFrom          (optional, ISO date)
 *   dateTo            (optional, ISO date)
 *   credentialStatus  (optional: issued | pending | expired | revoked)
 *   breakdown         (optional: "cohort" — include per-cohort rows)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrgContext } from '@/lib/org/getOrgContext';
import { requireOrgAccess } from '@/lib/auth/org-guard';
import { getOrgCohorts, getOrgProgress } from '@/lib/lms/engine/org-scope';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import type { OrgReportFilters } from '@/lib/lms/engine/org-scope';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  // Resolve org from session
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return safeError('Unauthorized', 401);

  let ctx;
  try {
    ctx = await getOrgContext(supabase, user.id);
  } catch {
    return safeError('No organization found for this user', 403);
  }

  // Canonical role check — requires org_admin or org_owner
  try {
    await requireOrgAccess(request, ctx.organization_id, 'org_admin');
  } catch (res) {
    return res as NextResponse;
  }

  const { searchParams } = new URL(request.url);
  const cohortId         = searchParams.get('cohortId')         ?? undefined;
  const programId        = searchParams.get('programId')        ?? undefined;
  const dateFrom         = searchParams.get('dateFrom')         ?? undefined;
  const dateTo           = searchParams.get('dateTo')           ?? undefined;
  const credentialStatus = (searchParams.get('credentialStatus') ?? undefined) as OrgReportFilters['credentialStatus'];
  const breakdown        = searchParams.get('breakdown');

  const filters: OrgReportFilters = {
    organizationId: ctx.organization_id,
    cohortId,
    programId,
    dateFrom,
    dateTo,
    credentialStatus,
  };

  try {
    const summary = await getOrgProgress(filters);

    let cohortBreakdown = null;
    if (breakdown === 'cohort' && !cohortId) {
      const cohorts = await getOrgCohorts(ctx.organization_id);
      cohortBreakdown = await Promise.all(
        cohorts.map(async (c) => {
          const cohortSummary = await getOrgProgress({ ...filters, cohortId: c.cohortId });
          return {
            cohortId:     c.cohortId,
            cohortName:   c.name,
            status:       c.status,
            startDate:    c.startDate,
            endDate:      c.endDate,
            deliveryMode: c.deliveryMode,
            ...cohortSummary,
          };
        })
      );
    }

    return NextResponse.json({
      organizationId:   ctx.organization_id,
      organizationName: ctx.organization.name,
      filters: {
        cohortId:         cohortId         ?? null,
        programId:        programId        ?? null,
        dateFrom:         dateFrom         ?? null,
        dateTo:           dateTo           ?? null,
        credentialStatus: credentialStatus ?? null,
      },
      summary,
      cohortBreakdown,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return safeInternalError(err, 'GET /api/org/reports');
  }
}
