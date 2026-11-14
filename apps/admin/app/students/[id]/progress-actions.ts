'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent } from '@/lib/audit';
import { apiRequireRoles } from '@/lib/admin/guards';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function setLearnerLessonCompletion(
  studentId: string,
  lessonId: string,
  completed: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!UUID.test(studentId) || !UUID.test(lessonId)) return { ok: false, error: 'Invalid lesson.' };
  const auth = await apiRequireRoles(undefined, ['admin', 'super_admin']);
  if (auth.error) return { ok: false, error: 'You do not have permission to change learner progress.' };
  const supabase = await createClient();
  const db = await requireAdminClient();

  const { data: lesson } = await db
    .from('course_lessons')
    .select('id,course_id,title')
    .eq('id', lessonId)
    .maybeSingle();
  if (!lesson) return { ok: false, error: 'Lesson not found.' };

  const now = new Date().toISOString();
  const { error } = await db.from('lesson_progress').upsert(
    {
      user_id: studentId,
      lesson_id: lessonId,
      course_id: lesson.course_id,
      completed,
      completed_at: completed ? now : null,
      progress_percent: completed ? 100 : 0,
      updated_at: now,
    },
    { onConflict: 'user_id,lesson_id' },
  );
  if (error) return { ok: false, error: 'Progress could not be saved. Try again.' };

  await writeAdminAuditEvent(supabase, {
    action: completed ? 'learner_lesson_marked_complete' : 'learner_lesson_marked_incomplete',
    target_type: 'lesson_progress',
    target_id: `${studentId}:${lessonId}`,
    metadata: {
      student_id: studentId,
      lesson_id: lessonId,
      course_id: lesson.course_id,
      lesson_title: lesson.title,
    },
  });
  revalidatePath(`/students/${studentId}`);
  return { ok: true };
}
