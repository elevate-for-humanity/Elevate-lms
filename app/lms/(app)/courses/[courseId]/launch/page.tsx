import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Launch Course',
  description: 'Launching course content',
  path: '/lms/courses',
});

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


interface Params {
  courseId: string;
}

export default async function LaunchCourse({ params }: { params: Params }) {
  const { courseId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: course, error } = await db
    .from('training_courses')
    .select(
      'id, slug, title, delivery_mode, partner_url, launch_mode, allow_iframe'
    )
    .eq('id', courseId)
    .single();

  if (error || !course) redirect('/lms/courses');

  // Track "started"
  await db.from('lms_progress').upsert(
    {
      user_id: user.id,
      course_id: course.id,
      course_slug: course.slug,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,course_id' }
  );

  // If not a partner link course, redirect to normal course page
  if (course.delivery_mode !== 'partner_link' || !course.partner_url) {
    redirect(`/lms/courses/${course.id}`);
  }

  // For partner link courses, redirect to partner platform
  // Best practice: external redirect (iframe often blocked by partners)
  redirect(course.partner_url);
}
