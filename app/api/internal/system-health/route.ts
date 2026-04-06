/**
 * GET /api/internal/system-health
 *
 * Returns a per-program integrity report from live DB state.
 * Checks enrollment_type consistency, LMS course presence, and external URL validity.
 *
 * This endpoint is internal — restrict to admin/staff in production via
 * ADMIN_IP_ALLOWLIST or an auth guard before exposing publicly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { checkAdminIP } from '@/lib/api/admin-ip-guard';
import { safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

interface ProgramHealthResult {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  delivery_model: string | null;
  enrollment_type: string | null;
  has_lms_course: boolean | null;
  lms_course_count: number;
  funding_count: number;
  status: 'PASS' | 'FAIL' | 'WARN';
  issues: string[];
}

export async function GET(request: NextRequest) {
  // IP guard — no-op if ADMIN_IP_ALLOWLIST is unset
  const blocked = checkAdminIP(request);
  if (blocked) return blocked;

  // Require either IP allowlist OR a valid internal secret header
  // Prevents open access when ADMIN_IP_ALLOWLIST is not configured
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get('x-internal-secret') ?? request.nextUrl.searchParams.get('secret');
  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Rate limit
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  try {
    const admin = createAdminClient();
    const db = admin ?? await createClient();

    const { data: programs, error } = await db
      .from('programs')
      .select(`
        id, slug, title, published, is_active, status,
        delivery_model, enrollment_type, external_enrollment_url, has_lms_course,
        program_funding(id, type, is_active),
        training_courses(id, slug, published)
      `)
      .eq('published', true)
      .eq('is_active', true)
      .neq('status', 'archived')
      .order('title', { ascending: true });

    if (error) {
      // program_funding or new columns may not exist yet (migration pending)
      // Fall back to basic check without new columns
      const { data: basicPrograms, error: basicError } = await db
        .from('programs')
        .select('id, slug, title, published, is_active, status')
        .eq('published', true)
        .eq('is_active', true)
        .neq('status', 'archived')
        .order('title', { ascending: true });

      if (basicError) return safeInternalError(basicError, 'Failed to query programs');

      return NextResponse.json({
        warning: 'Migration 20260503000005 not yet applied — delivery_model columns unavailable',
        program_count: basicPrograms?.length ?? 0,
        programs: (basicPrograms ?? []).map(p => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          status: 'WARN',
          issues: ['delivery_model column missing — apply migration 20260503000005'],
        })),
      });
    }

    const results: ProgramHealthResult[] = (programs ?? []).map(p => {
      const issues: string[] = [];
      const lmsCourseCount = (p.training_courses ?? []).length;
      const fundingCount = (p.program_funding ?? []).filter((f: { is_active: boolean }) => f.is_active).length;
      const enrollmentType = p.enrollment_type ?? 'internal';

      if (!p.slug) issues.push('Missing slug');
      if (!p.delivery_model) issues.push('delivery_model not set — apply migration 20260503000005');
      if (!p.enrollment_type) issues.push('enrollment_type not set — apply migration 20260503000005');
      if (fundingCount === 0) issues.push('No active funding options in program_funding');

      if (enrollmentType === 'internal' && p.has_lms_course && lmsCourseCount === 0) {
        issues.push('has_lms_course=true but no training_courses row attached');
      }

      if (enrollmentType === 'external' && !p.external_enrollment_url) {
        issues.push('enrollment_type=external but external_enrollment_url is null');
      }

      return {
        id: p.id,
        slug: p.slug ?? '(missing)',
        title: p.title,
        published: p.published,
        delivery_model: p.delivery_model,
        enrollment_type: p.enrollment_type,
        has_lms_course: p.has_lms_course,
        lms_course_count: lmsCourseCount,
        funding_count: fundingCount,
        status: issues.length === 0 ? 'PASS' : issues.some(i => i.includes('Missing') || i.includes('external_enrollment_url')) ? 'FAIL' : 'WARN',
        issues,
      };
    });

    const pass = results.filter(r => r.status === 'PASS').length;
    const fail = results.filter(r => r.status === 'FAIL').length;
    const warn = results.filter(r => r.status === 'WARN').length;

    return NextResponse.json({
      summary: { total: results.length, pass, fail, warn },
      programs: results,
    });
  } catch (err) {
    return safeInternalError(err, 'System health check failed');
  }
}
