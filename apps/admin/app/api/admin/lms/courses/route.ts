import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { API_ADMIN_ROLES } from '@/lib/rbac/role-matrix';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase server configuration');
  return { url, key };
}

export const GET = withAuth(async () => {
  try {
    const { url, key } = getConfig();
    const response = await fetch(
      `${url}/rest/v1/courses?select=id,title,slug,status,is_active,review_status,total_lessons,duration_hours,thumbnail_url,category,short_description,created_at,updated_at&is_active=eq.true&order=updated_at.desc`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      console.error('[admin/lms/courses] course fetch failed', response.status);
      return NextResponse.json({ error: 'Failed to load courses' }, { status: 502 });
    }

    const courses = (await response.json()) as Array<{
      id: string;
      title: string;
      slug: string;
      status: string;
      is_active: boolean;
      review_status: string;
      total_lessons: number;
      duration_hours: number;
      thumbnail_url: string;
      category: string;
      short_description: string;
      created_at: string;
      updated_at: string;
    }>;

    const courseIds = courses.map((course) => course.id);
    const moduleCounts: Record<string, number> = {};
    const lessonCounts: Record<string, number> = {};

    if (courseIds.length > 0) {
      const [modRes, lesRes] = await Promise.all([
        fetch(`${url}/rest/v1/course_modules?course_id=in.(${courseIds.join(',')})&select=course_id`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          cache: 'no-store',
        }),
        fetch(`${url}/rest/v1/course_lessons?course_id=in.(${courseIds.join(',')})&select=course_id`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          cache: 'no-store',
        }),
      ]);

      if (!modRes.ok || !lesRes.ok) {
        console.error('[admin/lms/courses] count fetch failed', modRes.status, lesRes.status);
      } else {
        const modules = (await modRes.json()) as Array<{ course_id: string }>;
        const lessons = (await lesRes.json()) as Array<{ course_id: string }>;
        modules.forEach((module) => {
          moduleCounts[module.course_id] = (moduleCounts[module.course_id] || 0) + 1;
        });
        lessons.forEach((lesson) => {
          lessonCounts[lesson.course_id] = (lessonCounts[lesson.course_id] || 0) + 1;
        });
      }
    }

    const enriched = courses.map((course) => ({
      ...course,
      total_lessons: lessonCounts[course.id] || course.total_lessons || 0,
      module_count: moduleCounts[course.id] || 0,
    }));

    return NextResponse.json(
      { courses: enriched },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[admin/lms/courses] GET failed', error);
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 });
  }
}, { roles: API_ADMIN_ROLES });

export const POST = withAuth(async () => {
  return NextResponse.json(
    { error: 'Use /api/admin/courses to create courses' },
    { status: 405 },
  );
}, { roles: API_ADMIN_ROLES });
