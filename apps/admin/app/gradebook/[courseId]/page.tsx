import { canEditCourse } from '@/lib/authGuards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { assignmentEvidenceLinks } from '@/lib/lms/assignment-evidence-links';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GradebookClient } from './GradebookClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Gradebook | Admin | Elevate LMS',
  description: 'Grade student submissions and manage course grades.',
};

export default async function AdminGradebookPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guard against null user
  if (!user) redirect('/login');
  if (!(await canEditCourse(courseId))) redirect('/unauthorized');
  const db = await requireAdminClient();
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id,title,program_id')
    .eq('id', courseId)
    .maybeSingle();
  if (courseError) throw courseError;
  if (!course) redirect('/courses');

  const { data: links, error: linkError } = await db
    .from('program_courses')
    .select('program_id')
    .eq('course_id', courseId);
  if (linkError) throw linkError;
  const programIds = [
    ...new Set([course.program_id, ...(links || []).map((l) => l.program_id)].filter(Boolean)),
  ];
  const [programs, direct, submissionResult, attempts, checkpoints, assignments] =
    await Promise.all([
      db
        .from('program_enrollments')
        .select('id,user_id,student_id,progress_percent,status')
        .or(
          `course_id.eq.${courseId}${programIds.length ? `,program_id.in.(${programIds.join(',')})` : ''}`,
        )
        .is('revoked_at', null)
        .in('status', ['active', 'enrolled', 'in_progress', 'confirmed', 'completed'])
        .order('created_at'),
      db
        .from('course_enrollments')
        .select('id,student_id,status')
        .eq('course_id', courseId)
        .in('status', ['active', 'enrolled', 'in_progress', 'confirmed', 'completed']),
      db
        .from('assignment_submissions')
        .select('*')
        .eq('course_id', courseId)
        .order('submitted_at', { ascending: false }),
      db.from('quiz_attempts').select('*').eq('course_id', courseId).eq('status', 'completed'),
      db.from('checkpoint_scores').select('*').eq('course_id', courseId),
      db.from('assignments').select('id,title,max_points').eq('course_id', courseId),
    ]);
  for (const result of [programs, direct, submissionResult, attempts, checkpoints, assignments])
    if (result.error) throw result.error;
  const students = new Map<string, any>();
  for (const row of programs.data || []) {
    const id = row.user_id || row.student_id;
    if (id)
      students.set(id, {
        ...row,
        user_id: id,
        progress: row.progress_percent,
      });
  }
  for (const row of direct.data || [])
    if (row.student_id && !students.has(row.student_id)) {
      students.set(row.student_id, {
        ...row,
        user_id: row.student_id,
        progress: 0,
      });
    }
  const ids = [...students.keys()];
  const [lessons, progress] = await Promise.all([
    db.from('course_lessons').select('id').eq('course_id', courseId).eq('is_published', true),
    ids.length
      ? db
          .from('lesson_progress')
          .select('user_id,lesson_id')
          .eq('course_id', courseId)
          .eq('completed', true)
          .in('user_id', ids)
      : { data: [], error: null },
  ]);
  if (lessons.error) throw lessons.error;
  if (progress.error) throw progress.error;
  const publishedIds = new Set((lessons.data || []).map((lesson) => lesson.id));
  for (const [id, row] of students) {
    const complete = new Set(
      (progress.data || [])
        .filter((p) => p.user_id === id && publishedIds.has(p.lesson_id))
        .map((p) => p.lesson_id),
    );
    row.progress = publishedIds.size ? Math.round((complete.size / publishedIds.size) * 100) : 0;
  }
  const profiles = ids.length
    ? await db.from('profiles').select('id,full_name,email').in('id', ids)
    : { data: [], error: null };
  if (profiles.error) throw profiles.error;
  const profileMap = new Map((profiles.data || []).map((p) => [p.id, p]));
  const enrollments = [...students.values()].map((row) => ({
    ...row,
    profiles: profileMap.get(row.user_id) || null,
  }));
  const assignmentMap = new Map((assignments.data || []).map((a) => [a.id, a]));
  const submissions = await Promise.all(
    (submissionResult.data || []).map(async (row) => ({
      ...row,
      user_id: row.user_id || row.student_id,
      content: row.submission_text || '',
      assignment_title: assignmentMap.get(row.assignment_id)?.title || 'Assignment',
      max_points: assignmentMap.get(row.assignment_id)?.max_points || 100,
      attachments: await assignmentEvidenceLinks(db, row),
    })),
  );
  const checkpointBest = new Map<string, any>();
  for (const row of checkpoints.data || []) {
    const key = `${row.user_id}:${row.lesson_id}`;
    if (!checkpointBest.has(key) || Number(row.score) > Number(checkpointBest.get(key).score))
      checkpointBest.set(key, row);
  }
  const quizAttempts = [
    ...(attempts.data || []).map((row) => ({ ...row, user_id: row.user_uuid, max_score: 100 })),
    ...[...checkpointBest.values()].map((row) => ({
      ...row,
      quiz_id: row.lesson_id,
      max_score: 100,
      status: 'completed',
    })),
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Gradebook: {course.title}</h1>
        </div>

        <GradebookClient
          courseId={courseId}
          enrollments={(enrollments || []) as any[]}
          submissions={submissions || []}
          quizAttempts={quizAttempts || []}
        />
      </div>
    </div>
  );
}
