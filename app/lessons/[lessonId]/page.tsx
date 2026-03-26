import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ lessonId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params;
  const supabase = await createClient();
  
  
  const { data: lesson } = await supabase
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


  // Get the lesson to find its course
  const { data: lesson, error } = await supabase
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
