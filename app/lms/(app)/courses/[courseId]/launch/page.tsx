import { Metadata } from 'next';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Launch Course',
  description: 'Launching course content',
  path: '/lms/courses',
});

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface Params {
  courseId: string;
}

export default async function LaunchCourse({ params }: { params: Params }) {
  const { courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // courses table has no delivery_mode/partner_url/launch_mode/allow_iframe columns.
  // Those fields live on training_courses. Fetch both and merge.
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, slug, title, legacy_course_id')
    .eq('id', courseId)
    .maybeSingle();

  if (error || !course) redirect('/lms/courses');

  // Fetch partner-link fields from training_courses via legacy_course_id
  const { data: tc } = course.legacy_course_id
    ? await supabase
        .from('lms_courses')
        .select('delivery_mode, partner_url')
        .eq('id', course.legacy_course_id)
        .maybeSingle()
    : { data: null };

  // Track "started"
  await supabase.from('lms_progress').upsert(
    {
      user_id: user.id,
      course_id: course.id,
      course_slug: course.slug,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,course_id' },
  );

  // If not a partner link course, redirect to normal course page
  if (tc?.delivery_mode !== 'partner_link' || !tc?.partner_url) {
    redirect(`/lms/courses/${course.id}`);
  }

  // For partner link courses, redirect to partner platform
  redirect(tc.partner_url);
}
