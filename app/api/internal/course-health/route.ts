/**
 * GET /api/internal/course-health
 *
 * Returns PASS or FAIL for every course in the canonical `courses` table.
 * A course with ANY blocking issue returns status: "FAIL".
 * Publish is blocked when health.status !== "PASS".
 *
 * Protected: admin or super_admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeInternalError } from '@/lib/api/safe-error';

type HealthStatus = 'PASS' | 'FAIL';

interface CourseHealthReport {
  course_id:          string;
  slug:               string;
  title:              string;
  status:             string;
  is_active:          boolean;
  health:             HealthStatus;
  blocking_issues:    string[];
  warnings:           string[];
  module_count:       number;
  lesson_count:       number;
  null_type_count:    number;
  empty_modules:      string[];
  gating_rules_count: number;
  version_count:      number;
}

interface HealthSummary {
  total:   number;
  passing: number;
  failing: number;
  overall: HealthStatus;
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: courses, error: coursesErr } = await supabase
      .from('courses')
      .select(`
        id, slug, title, status, is_active,
        course_modules (
          id, title, order_index,
          course_lessons ( id, lesson_type, is_required )
        )
      `)
      .order('status');

    if (coursesErr) throw coursesErr;
    if (!courses?.length) {
      return NextResponse.json({
        courses: [],
        summary: { total: 0, passing: 0, failing: 0, overall: 'FAIL' as HealthStatus },
      });
    }

    const courseIds = courses.map((c: { id: string }) => c.id);

    const { data: gatingRules } = await supabase
      .from('module_completion_rules')
      .select('course_id')
      .in('course_id', courseIds);

    const gatingCount = new Map<string, number>();
    for (const r of gatingRules ?? []) {
      const row = r as { course_id: string };
      gatingCount.set(row.course_id, (gatingCount.get(row.course_id) ?? 0) + 1);
    }

    const { data: versionRows } = await supabase
      .from('course_versions')
      .select('course_id')
      .in('course_id', courseIds)
      .eq('is_published', true);

    const versionCount = new Map<string, number>();
    for (const v of versionRows ?? []) {
      const row = v as { course_id: string };
      versionCount.set(row.course_id, (versionCount.get(row.course_id) ?? 0) + 1);
    }

    const reports: CourseHealthReport[] = courses.map((c: {
      id: string; slug: string; title: string; status: string; is_active: boolean;
      course_modules: Array<{
        id: string; title: string; order_index: number;
        course_lessons: Array<{ id: string; lesson_type: string | null; is_required: boolean }>;
      }>;
    }) => {
      const blocking: string[] = [];
      const warnings: string[] = [];

      const modules = c.course_modules ?? [];
      const moduleCount = modules.length;
      const lessonCount = modules.reduce((s, m) => s + (m.course_lessons?.length ?? 0), 0);

      const nullTypeCount = modules.reduce(
        (s, m) => s + (m.course_lessons ?? []).filter(l => !l.lesson_type).length,
        0,
      );

      const emptyModules = modules
        .filter(m => (m.course_lessons?.length ?? 0) === 0)
        .map(m => m.title);

      const gating  = gatingCount.get(c.id) ?? 0;
      const versions = versionCount.get(c.id) ?? 0;

      if (!c.slug)           blocking.push('missing slug');
      if (!c.title)          blocking.push('missing title');
      if (moduleCount === 0) blocking.push('no modules');
      if (lessonCount === 0) blocking.push('no lessons');
      if (nullTypeCount > 0) blocking.push(`${nullTypeCount} lesson(s) with NULL lesson_type`);
      if (emptyModules.length > 0) {
        blocking.push(`empty module(s): ${emptyModules.join(', ')}`);
      }
      if (moduleCount > 1 && gating === 0) {
        blocking.push('multiple modules but no module_completion_rules');
      }

      if (c.status === 'published' && versions === 0) {
        warnings.push('published but no version snapshot — run snapshot_course_version()');
      }
      if (!c.is_active && c.status === 'published') {
        warnings.push('published but is_active=false');
      }

      return {
        course_id:          c.id,
        slug:               c.slug,
        title:              c.title,
        status:             c.status,
        is_active:          c.is_active,
        health:             blocking.length === 0 ? 'PASS' : 'FAIL',
        blocking_issues:    blocking,
        warnings,
        module_count:       moduleCount,
        lesson_count:       lessonCount,
        null_type_count:    nullTypeCount,
        empty_modules:      emptyModules,
        gating_rules_count: gating,
        version_count:      versions,
      } satisfies CourseHealthReport;
    });

    const passing = reports.filter(r => r.health === 'PASS').length;
    const summary: HealthSummary = {
      total:   reports.length,
      passing,
      failing: reports.length - passing,
      overall: passing === reports.length ? 'PASS' : 'FAIL',
    };

    return NextResponse.json({ courses: reports, summary });
  } catch (error) {
    return safeInternalError(error, 'Course health check failed');
  }
}
