export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import SpeedGraderWrapper from './SpeedGraderWrapper';

export const metadata: Metadata = {
  title: 'SpeedGrader | Elevate For Humanity',
  description: 'Grade student submissions.',
};

type Params = Promise<{ courseId: string; assignmentId: string }>;

export default async function SpeedGraderPage({ params }: { params: Params }) {
  const { courseId, assignmentId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Service Unavailable</p>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify instructor role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff', 'instructor'].includes(profile.role)) {
    redirect('/lms/dashboard');
  }

  // Fetch assignment
  const { data: assignment, error: assignmentError } = await db
    .from('assignments')
    .select('id, title, description, max_points, course_id, due_date')
    .eq('id', assignmentId)
    .eq('course_id', courseId)
    .single();

  if (assignmentError || !assignment) {
    notFound();
  }

  // Fetch rubric if linked
  const { data: rubricLink } = await db
    .from('assignment_rubrics')
    .select('rubric_id, rubrics(*)')
    .eq('assignment_id', assignmentId)
    .single();

  // Fetch submissions with student info
  const { data: submissions } = await db
    .from('assignment_submissions')
    .select(`
      id,
      student_id,
      content,
      file_urls,
      submitted_at,
      is_late,
      profiles!inner(full_name, email)
    `)
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: true });

  // Fetch existing grades for these submissions
  const submissionIds = (submissions || []).map((s: any) => s.id);
  const { data: existingGrades } = submissionIds.length > 0
    ? await db
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
