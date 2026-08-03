import { NextResponse } from "next/server";
import { withAuth } from '@/lib/with-auth';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase config");
  return { url, key };
}

export const GET = withAuth(async () => {
  try {
    const { url, key } = getConfig();
    
    // Fetch courses with module/lesson counts
    const response = await fetch(
      `${url}/rest/v1/courses?select=id,title,slug,status,is_active,review_status,total_lessons,duration_hours,thumbnail_url,category,short_description,created_at,updated_at&is_active=eq.true&order=updated_at.desc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      }
    );
    
    const courses = await response.json();
    
    // Get module/lesson counts per course
    const courseIds = courses.map((c: { id: string }) => c.id);
    
    let moduleCounts: Record<string, number> = {};
    let lessonCounts: Record<string, number> = {};
    
    if (courseIds.length > 0) {
      const idsParam = courseIds.map(id => `course_id=eq.${id}`).join('&');
      
      const [modRes, lesRes] = await Promise.all([
        fetch(`${url}/rest/v1/course_modules?course_id=in.(${courseIds.join(',')})&select=course_id`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        }),
        fetch(`${url}/rest/v1/course_lessons?course_id=in.(${courseIds.join(',')})&select=course_id`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        }),
      ]);
      
      const modules = await modRes.json();
      const lessons = await lesRes.json();
      
      modules.forEach((m: { course_id: string }) => {
        moduleCounts[m.course_id] = (moduleCounts[m.course_id] || 0) + 1;
      });
      lessons.forEach((l: { course_id: string }) => {
        lessonCounts[l.course_id] = (lessonCounts[l.course_id] || 0) + 1;
      });
    }
    
    const enriched = courses.map((c: { id: string; title: string; slug: string; status: string; is_active: boolean; review_status: string; total_lessons: number; duration_hours: number; thumbnail_url: string; category: string; short_description: string; created_at: string; updated_at: string }) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      status: c.status,
      is_active: c.is_active,
      review_status: c.review_status,
      total_lessons: lessonCounts[c.id] || c.total_lessons || 0,
      module_count: moduleCounts[c.id] || 0,
      duration_hours: c.duration_hours,
      thumbnail_url: c.thumbnail_url,
      category: c.category,
      short_description: c.short_description,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));
    
    return NextResponse.json({ courses: enriched }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load courses" },
      { status: 500 }
    );
  }
});

export async function POST() {
  return NextResponse.json({ error: "Use /api/admin/courses to create courses" }, { status: 405 });
}
