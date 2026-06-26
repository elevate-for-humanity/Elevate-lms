/**
 * GET /api/admin/program-integrity
 *
 * Returns program integrity scores from the program_integrity view.
 * Falls back to a code-side integrity audit when the Supabase view has not
 * been applied yet, so the admin dashboard never shows a dead panel.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SupabaseAdminClient = Awaited<ReturnType<typeof requireAdminClient>>;

type ProgramIntegrityRow = {
  id: string;
  slug: string | null;
  title: string | null;
  status: string | null;
  category: string | null;
  published: boolean | null;
  is_active: boolean | null;
  total_lessons: number;
  total_modules: number;
  active_enrollments: number;
  certificates_issued: number;
  has_course_row: boolean;
  has_completion_rule: boolean;
  integrity_score: number;
  failing_checks: string[];
};

function asNumberMap(rows: unknown[] | null | undefined, key: string, value: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of rows ?? []) {
    if (!row || typeof row !== 'object') continue;
    const record = row as Record<string, unknown>;
    const id = typeof record[key] === 'string' ? record[key] : null;
    const count = typeof record[value] === 'number' ? record[value] : Number(record[value] ?? 0);
    if (id) out.set(id, Number.isFinite(count) ? count : 0);
  }
  return out;
}

async function groupedCount(
  db: SupabaseAdminClient,
  table: string,
  groupColumn: string,
  options: { select?: string; filter?: (query: any) => any } = {},
): Promise<Map<string, number>> {
  try {
    let query = db.from(table).select(options.select ?? `${groupColumn}, id`);
    if (options.filter) query = options.filter(query);
    const { data, error } = await query;
    if (error || !Array.isArray(data)) return new Map();
    const counts = new Map<string, number>();
    for (const row of data as Array<Record<string, unknown>>) {
      const id = row[groupColumn];
      if (typeof id === 'string') counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  } catch {
    return new Map();
  }
}

async function fallbackProgramIntegrity(
  db: SupabaseAdminClient,
  limit: number,
  maxScore: number,
): Promise<ProgramIntegrityRow[]> {
  const { data: programs, error } = await db
    .from('programs')
    .select('id, slug, title, status, category, published, is_active, description')
    .neq('status', 'archived')
    .order('title', { ascending: true })
    .limit(300);

  if (error || !Array.isArray(programs)) {
    logger.warn('[program-integrity] fallback programs query failed', { error });
    return [];
  }

  const curriculumLessonCounts = await groupedCount(db, 'curriculum_lessons', 'program_id', {
    select: 'program_id, id, status',
    filter: (query) => query.eq('status', 'published'),
  });
  const moduleCounts = await groupedCount(db, 'modules', 'program_id');
  const enrollmentCounts = await groupedCount(db, 'program_enrollments', 'program_id', {
    select: 'program_id, id, status',
    filter: (query) => query.eq('status', 'active'),
  });
  const certificateCounts = await groupedCount(db, 'program_completion_certificates', 'program_id');

  let courseRows: unknown[] | null;
  try {
    const { data } = await db.from('courses').select('program_id, id');
    courseRows = data ?? null;
  } catch {
    courseRows = null;
  }
  const courseCounts = asNumberMap(courseRows, 'program_id', 'id');

  let completionRuleRows: unknown[] | null;
  try {
    const { data } = await db
      .from('completion_rules')
      .select('entity_id, entity_type')
      .eq('entity_type', 'program');
    completionRuleRows = data ?? null;
  } catch {
    completionRuleRows = null;
  }
  const completionRuleIds = new Set(
    (completionRuleRows ?? [])
      .map((row) => (row && typeof row === 'object' ? (row as Record<string, unknown>).entity_id : null))
      .filter((value): value is string => typeof value === 'string'),
  );

  return (programs as Array<Record<string, unknown>>)
    .map((program) => {
      const id = String(program.id);
      const slug = typeof program.slug === 'string' ? program.slug : null;
      const title = typeof program.title === 'string' ? program.title : null;
      const category = typeof program.category === 'string' ? program.category : null;
      const description = typeof program.description === 'string' ? program.description : null;
      const published = program.published === true;
      const totalLessons = curriculumLessonCounts.get(id) ?? 0;
      const totalModules = moduleCounts.get(id) ?? 0;
      const activeEnrollments = enrollmentCounts.get(id) ?? 0;
      const certificatesIssued = certificateCounts.get(id) ?? 0;
      const hasCourseRow = courseCounts.has(id);
      const hasCompletionRule = completionRuleIds.has(id);
      const failingChecks = [
        totalLessons > 0 ? null : 'no_lessons',
        totalModules > 0 ? null : 'no_modules',
        hasCourseRow ? null : 'no_course_row',
        hasCompletionRule ? null : 'no_completion_rule',
        title?.trim() ? null : 'no_title',
        slug && !slug.includes('test') && !slug.startsWith('ai-') && !slug.startsWith('gen-') && !slug.startsWith('pub-path-') ? null : 'bad_slug',
        category?.trim() ? null : 'no_category',
        published ? null : 'not_published',
        activeEnrollments > 0 ? null : 'no_enrollments',
        description?.trim() ? null : 'no_description',
      ].filter((check): check is string => typeof check === 'string');

      return {
        id,
        slug,
        title,
        status: typeof program.status === 'string' ? program.status : null,
        category,
        published,
        is_active: program.is_active === true,
        total_lessons: totalLessons,
        total_modules: totalModules,
        active_enrollments: activeEnrollments,
        certificates_issued: certificatesIssued,
        has_course_row: hasCourseRow,
        has_completion_rule: hasCompletionRule,
        integrity_score: Math.max(0, 100 - failingChecks.length * 10),
        failing_checks: failingChecks,
      };
    })
    .filter((row) => row.integrity_score <= maxScore)
    .sort((a, b) => a.integrity_score - b.integrity_score || String(a.title).localeCompare(String(b.title)))
    .slice(0, limit);
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = request.nextUrl;
  const parsedLimit = parseInt(searchParams.get('limit') ?? '20', 10);
  const parsedMaxScore = parseInt(searchParams.get('min') ?? '100', 10);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 20;
  const maxScore = Number.isFinite(parsedMaxScore) ? Math.min(Math.max(parsedMaxScore, 0), 100) : 100;

  const db = await requireAdminClient();

  const { data, error } = await db
    .from('program_integrity')
    .select(
      'id, slug, title, status, category, published, is_active, ' +
      'total_lessons, total_modules, active_enrollments, certificates_issued, ' +
      'has_course_row, has_completion_rule, integrity_score, failing_checks',
    )
    .lte('integrity_score', maxScore)
    .order('integrity_score', { ascending: true })
    .limit(limit);

  if (!error) {
    return NextResponse.json(
      { programs: data ?? [], source: 'view' },
      { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' } },
    );
  }

  logger.warn('[program-integrity] view unavailable; using fallback audit', {
    code: error.code,
    message: error.message,
  });

  const programs = await fallbackProgramIntegrity(db, limit, maxScore);
  return NextResponse.json(
    {
      programs,
      pending_migration: error.code === '42P01',
      source: 'fallback',
      fallback_reason: 'program_integrity view unavailable; dashboard used live table counts',
    },
    { headers: { 'Cache-Control': 'private, max-age=120, stale-while-revalidate=60' } },
  );
}
