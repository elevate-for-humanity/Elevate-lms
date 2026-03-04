export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Courses with local definitions that work without Supabase data.
// Skip the DB existence check for these — the child pages and API
// routes fall back to lib/courses/definitions.ts.
const KNOWN_COURSE_IDS = new Set([
  'f0593164-55be-5867-98e7-8a86770a8dd0', // HVAC Technician
]);

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  // Known courses have local definitions — skip DB check
  if (KNOWN_COURSE_IDS.has(courseId)) {
    return children;
  }

  const supabase = await createClient();
  const admin = createAdminClient();
  const db = admin || supabase;

  if (!db) return notFound();

  const { data: course } = await db
    .from('training_courses')
    .select('id')
    .eq('id', courseId)
    .single();

  if (!course) notFound();

  return children;
}
