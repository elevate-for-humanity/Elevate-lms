
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


  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify instructor role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff', 'instructor'].includes(profile.role)) {
    redirect('/learner/dashboard');
  }

  // Fetch assignment
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('id, title, description, max_points, course_id, due_date')
    .eq('id', assignmentId)
    .eq('course_id', courseId)
    .single();

  if (assignmentError || !assignment) {
    notFound();
  }

  // Fetch rubric if linked
  const { data: rubricLink } = await supabase
    .from('assignment_rubrics')
    .select('rubric_id, rubrics(*)')
    .eq('assignment_id', assignmentId)
    .single();

  // Fetch submissions
  const { data: rawGradeSubmissions } = await supabase
    .from('assignment_submissions')
    .select(`id, student_id, content, file_urls, submitted_at, is_late`)
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: true });

  // Hydrate profiles separately (assignment_submissions has no FK to profiles)
  const gradeStudentIds = [...new Set((rawGradeSubmissions ?? []).map((s: any) => s.student_id).filter(Boolean))];
  const { data: gradeStudentProfiles } = gradeStudentIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', gradeStudentIds)
    : { data: [] };
  const gradeStudentMap = Object.fromEntries((gradeStudentProfiles ?? []).map((p: any) => [p.id, p]));
  const submissions = (rawGradeSubmissions ?? []).map((s: any) => ({ ...s, profiles: gradeStudentMap[s.student_id] ?? null }));

  // Fetch existing grades for these submissions
  const submissionIds = (submissions || []).map((s: any) => s.id);
  const { data: existingGrades } = submissionIds.length > 0
    ? await supabase
        .from('grades')
        .select('*')
        .in('submission_id', submissionIds)
    : { data: [] };

  const gradeMap = new Map((existingGrades || []).map((g: any) => [g.submission_id, g]));

  // Transform for SpeedGrader component
  const formattedSubmissions = (submissions || []).map((s: any) => ({
    id: s.id,
    assignmentId,
    studentId: s.student_id,
    studentName: s.profiles?.full_name || 'Student',
    studentEmail: s.profiles?.email || '',
    submittedAt: s.submitted_at,
    content: s.content || '',
    attachments: s.file_urls || [],
    status: gradeMap.has(s.id) ? 'graded' as const : s.is_late ? 'late' as const : 'submitted' as const,
    isLate: s.is_late || false,
    existingGrade: gradeMap.get(s.id) || null,
  }));

  // Transform rubric if present
  const rubric = rubricLink?.rubrics ? {
    id: (rubricLink.rubrics as any).id,
    name: (rubricLink.rubrics as any).name,
    criteria: (rubricLink.rubrics as any).criteria || [],
    totalPoints: (rubricLink.rubrics as any).total_points || assignment.max_points,
  } : undefined;

  return (
    <>
      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/instructor-page-4.jpg" alt="Instructor portal" fill sizes="100vw" className="object-cover" priority />
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
