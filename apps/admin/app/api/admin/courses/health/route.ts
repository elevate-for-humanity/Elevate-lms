/** Course Builder Health Endpoint */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { isCourseBuilderGenerationPaused } from '@/lib/course-builder/generation-control';
import { applyRateLimit } from '@/lib/api/withRateLimit';

interface CapabilityHealth {
  capability: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  configured: boolean;
  checks: Array<{ name: string; passed: boolean; message: string }>;
  checkedAt: string;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const checks: CapabilityHealth['checks'] = [];
  let status: CapabilityHealth['status'] = 'healthy';
  const supabase = await requireAdminClient();

  try {
    const { error } = await supabase.from('courses').select('id').limit(1);
    checks.push({ name: 'Courses Table', passed: !error, message: error ? 'Table not accessible' : 'Accessible' });
    if (error) status = 'degraded';
  } catch {
    checks.push({ name: 'Courses Table', passed: false, message: 'Connection failed' });
    status = 'unavailable';
  }

  try {
    const { error } = await supabase.from('course_modules').select('id').limit(1);
    checks.push({ name: 'Canonical Modules', passed: !error, message: error ? 'course_modules is not accessible' : 'course_modules is accessible' });
    if (error) status = 'degraded';
  } catch {
    checks.push({ name: 'Canonical Modules', passed: false, message: 'course_modules check failed' });
    status = 'degraded';
  }

  try {
    const { error } = await supabase.from('course_lessons').select('id').limit(1);
    checks.push({ name: 'Canonical Lessons', passed: !error, message: error ? 'course_lessons is not accessible' : 'course_lessons is accessible' });
    if (error) status = 'degraded';
  } catch {
    checks.push({ name: 'Canonical Lessons', passed: false, message: 'course_lessons check failed' });
    status = 'degraded';
  }

  try {
    const [{ data: published, error: courseError }, { data: modules, error: moduleError }, { data: lessons, error: lessonError }] = await Promise.all([
      supabase.from('courses').select('id, duration_hours, program_id').eq('status', 'published'),
      supabase.from('course_modules').select('course_id'),
      supabase.from('course_lessons').select('course_id'),
    ]);
    if (courseError || moduleError || lessonError) throw new Error('Integrity query failed');
    const moduleCourses = new Set((modules ?? []).map((row) => row.course_id));
    const lessonCourses = new Set((lessons ?? []).map((row) => row.course_id));
    const invalid = (published ?? []).filter(
      (course) =>
        !course.program_id ||
        Number(course.duration_hours ?? 0) <= 0 ||
        !moduleCourses.has(course.id) ||
        !lessonCourses.has(course.id),
    );
    checks.push({
      name: 'Published Course Integrity',
      passed: invalid.length === 0,
      message: invalid.length === 0
        ? `${published?.length ?? 0} published courses pass the basic program, duration, module, and lesson checks`
        : `${invalid.length} of ${published?.length ?? 0} published courses require governed repair`,
    });
    if (invalid.length) status = 'degraded';
  } catch {
    checks.push({ name: 'Published Course Integrity', passed: false, message: 'Unable to calculate course integrity' });
    status = 'degraded';
  }

  const generationPaused = await isCourseBuilderGenerationPaused(supabase);
  checks.push({
    name: 'Course Factory Generation',
    passed: !generationPaused,
    message: generationPaused ? 'Paused by the canonical generation control' : 'Enabled',
  });
  if (generationPaused) status = 'degraded';

  const hasAiKey = !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
  checks.push({ name: 'AI Course Builder', passed: hasAiKey, message: hasAiKey ? 'AI provider configured' : 'No AI provider - course builder will use manual mode' });
  if (!hasAiKey) status = 'degraded';

  const response: CapabilityHealth = { capability: 'course-builder', status, configured: true, checks, checkedAt: new Date().toISOString() };
  return NextResponse.json(response, { status: status === 'unavailable' ? 503 : 200 });
}
