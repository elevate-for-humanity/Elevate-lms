import { canEditCourse } from '@/lib/authGuards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { assignmentEvidenceLinks } from '@/lib/lms/assignment-evidence-links';
import { IMAGE_LOADING_BLUR } from '@/lib/ui/blur-placeholder';
import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import SpeedGraderWrapper from './SpeedGraderWrapper';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SpeedGrader | Elevate For Humanity',
  description: 'Grade student submissions.',
};

type Params = Promise<{ courseId: string; assignmentId: string }>;

export default async function SpeedGraderPage({ params }: { params: Params }) {
  const { courseId, assignmentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guard against null user
  if (!user) redirect('/login');
  if (!(await canEditCourse(courseId))) redirect('/unauthorized');
  const db = await requireAdminClient();

  // Fetch assignment
  const { data: assignment, error: assignmentError } = await db
    .from('assignments')
    .select('id, title, description, max_points, course_id, due_date')
    .eq('id', assignmentId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (assignmentError || !assignment) {
    notFound();
  }

  // Fetch rubric if linked
  const { data: rubricLink } = await db
    .from('assignment_rubrics')
    .select('rubric_id, rubrics(*)')
    .eq('assignment_id', assignmentId)
    .maybeSingle();

  // Fetch submissions
  const { data: rawGradeSubmissions, error: submissionError } = await db
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: true });

  if (submissionError) throw submissionError;

  // Hydrate profiles separately (assignment_submissions has no FK to profiles)
  const gradeStudentIds = [
    ...new Set(
      (rawGradeSubmissions ?? []).map((s: any) => s.student_id || s.user_id).filter(Boolean),
    ),
  ];
  const { data: gradeStudentProfiles } = gradeStudentIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', gradeStudentIds)
    : { data: [] };
  const gradeStudentMap = Object.fromEntries(
    (gradeStudentProfiles ?? []).map((p: any) => [p.id, p]),
  );
  const submissions = (rawGradeSubmissions ?? []).map((s: any) => ({
    ...s,
    student_id: s.student_id || s.user_id,
    profiles: gradeStudentMap[s.student_id || s.user_id] ?? null,
    is_late: Boolean(
      assignment.due_date &&
      s.submitted_at &&
      Date.parse(s.submitted_at) > Date.parse(assignment.due_date),
    ),
  }));

  const formattedSubmissions = await Promise.all(
    submissions.map(async (s: any) => ({
      id: s.id,
      assignmentId,
      studentId: s.student_id,
      studentName: s.profiles?.full_name || 'Student',
      studentEmail: s.profiles?.email || '',
      submittedAt: s.submitted_at,
      content: s.submission_text || '',
      attachments: await assignmentEvidenceLinks(db, s),
      status:
        s.grade != null
          ? ('graded' as const)
          : s.is_late
            ? ('late' as const)
            : ('submitted' as const),
      isLate: s.is_late,
      existingGrade: s.grade,
    })),
  );

  // Transform rubric if present
  const rubric = rubricLink?.rubrics
    ? {
        id: (rubricLink.rubrics as any).id,
        name: (rubricLink.rubrics as any).name,
        criteria: (rubricLink.rubrics as any).criteria || [],
        totalPoints: (rubricLink.rubrics as any).total_points || assignment.max_points,
      }
    : undefined;

  return (
    <>
      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image
          placeholder="blur"
          blurDataURL={IMAGE_LOADING_BLUR}
          src="/images/pages/instructor-page-4.webp"
          alt="Instructor portal"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>
      <SpeedGraderWrapper
        courseId={courseId}
        assignment={{
          id: assignment.id,
          title: assignment.title,
          points: assignment.max_points || 100,
          rubric,
        }}
        submissions={formattedSubmissions}
      />
    </>
  );
}
