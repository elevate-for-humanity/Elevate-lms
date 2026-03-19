import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ lessonId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  if (!supabase) return { title: 'Lesson | Elevate LMS' };
  
  const { data: lesson } = await db
    .from('course_lessons')
    .select('title, course_id')
    .eq('id', lessonId)
    .single();

  return {
    title: lesson ? `${lesson.title} | Elevate LMS` : 'Lesson | Elevate LMS',
  };
}

// Redirect to the proper LMS lesson URL
export default async function LessonRedirectPage({ params }: Props) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
        </div>
      </div>
    );
  }

  // Get the lesson to find its course
  const { data: lesson, error } = await db
    .from('course_lessons')
    .select('course_id')
    .eq('id', lessonId)
    .single();

  if (error || !lesson) {
    notFound();
  }

  // Redirect to the proper LMS lesson URL
  redirect(`/lms/courses/${lesson.course_id}/lessons/${lessonId}`);
}
