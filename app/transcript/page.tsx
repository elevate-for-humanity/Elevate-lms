import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import TranscriptContent from './TranscriptContent';

export const dynamic = 'force-dynamic';

export default async function TranscriptPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/transcript');

  const db = createAdminClient();

  // Enrollment + program
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, progress, enrolled_at, completed_at, course_id, training_courses(id, title)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  // All lessons for this course
  const courseId = (enrollment?.training_courses as any)?.id ?? enrollment?.course_id;
  const { data: lessons } = courseId
    ? await db.from('lms_lessons').select('id, title, lesson_number, step_type, module_id').eq('course_id', courseId)
    : { data: [] };

  // Lesson progress for this user
  const lessonIds = (lessons ?? []).map((l: any) => l.id);
  const { data: progress } = lessonIds.length > 0
    ? await db.from('lesson_progress').select('lesson_id, completed').eq('user_id', user.id).in('lesson_id', lessonIds)
    : { data: [] };

  // Checkpoint scores
  const { data: checkpointScores } = await db
    .from('checkpoint_scores')
    .select('lesson_id, passed, score')
    .eq('user_id', user.id);

  const progressMap = new Map((progress ?? []).map((p: any) => [p.lesson_id, p.completed]));
  const checkpointMap = new Map((checkpointScores ?? []).map((c: any) => [c.lesson_id, c]));

  const allLessons = lessons ?? [];
  const completedLessons = allLessons.filter((l: any) => progressMap.get(l.id)).length;
  const checkpointLessons = allLessons.filter((l: any) => l.step_type === 'checkpoint');
  const checkpointsPassed = checkpointLessons.filter((l: any) => checkpointMap.get(l.id)?.passed).length;

  // Group lessons into domains by module_id (each module = one domain)
  const { data: modules } = courseId
    ? await db.from('modules').select('id, title, module_order').eq('course_id', courseId).order('module_order')
    : { data: [] };

  const domains = (modules ?? []).map((mod: any, idx: number) => {
    const modLessons = allLessons.filter((l: any) => l.module_id === mod.id);
    const completedCount = modLessons.filter((l: any) => progressMap.get(l.id)).length;
    return {
      code: `M${String(idx + 1).padStart(2, '0')}`,
      name: mod.title,
      theoryHours: modLessons.filter((l: any) => l.step_type === 'lesson').length,
      ojtHours: modLessons.filter((l: any) => l.step_type === 'lab').length,
      completedCount,
      totalCount: modLessons.length,
      competencies: modLessons.map((l: any) => {
        const cp = checkpointMap.get(l.id);
        const done = progressMap.get(l.id);
        return {
          code: `M${String(idx + 1).padStart(2, '0')}-${String(l.lesson_number ?? 0).padStart(2, '0')}`,
          name: l.title,
          type: l.step_type ?? 'lesson',
          status: done ? 'completed' : cp ? 'in_progress' : 'not_started',
          score: cp?.score ?? null,
        };
      }),
    };
  });

  const courseTitle = (enrollment?.training_courses as any)?.title ?? 'Training Program';

  return (
    <TranscriptContent
      student={{
        full_name: profile?.full_name ?? user.email ?? 'Student',
        email: profile?.email ?? user.email ?? '',
        enrolled_at: enrollment?.enrolled_at ?? null,
        program_title: courseTitle,
        progress: enrollment?.progress ?? 0,
        completed_at: enrollment?.completed_at ?? null,
      }}
      domains={domains}
      totalTheoryHours={domains.reduce((s: number, d: any) => s + d.theoryHours, 0)}
      totalOjtHours={domains.reduce((s: number, d: any) => s + d.ojtHours, 0)}
      completedLessons={completedLessons}
      totalLessons={allLessons.length}
      checkpointsPassed={checkpointsPassed}
      totalCheckpoints={checkpointLessons.length}
      generatedAt={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    />
  );
}
