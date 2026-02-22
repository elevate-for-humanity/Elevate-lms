import { createClient } from '@/lib/supabase/server';

export async function updateLessonCompletion(userId: string, lessonId: string, completed: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    });

  return { error };
}

export async function updateVideoProgress(userId: string, lessonId: string, progress: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('video_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      progress_seconds: progress,
      last_watched: new Date().toISOString(),
    });

  return { error };
}

export async function getCourseProgress(userId: string, courseId: string) {
  const supabase = await createClient();

  const { data: lessons } = await supabase
    .from('training_lessons')
    .select('id')
    .eq('course_id', courseId);

  const { data: completed } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true);

  const total = lessons?.length || 0;
  const completedCount = completed?.length || 0;

  return {
    total,
    completed: completedCount,
    percentage: total > 0 ? Math.round((completedCount / total) * 100) : 0,
  };
}
