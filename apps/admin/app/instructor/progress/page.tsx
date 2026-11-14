import Link from 'next/link';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { ProgressReportClient } from './ProgressReportClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: '48-Hour Progress Forms | Instructor',
  robots: { index: false, follow: false },
};

export default async function InstructorProgressPage() {
  const { user, effectiveRoles } = await requireRole(['instructor', 'admin']);
  const db = await requireAdminClient();
  const isAdmin = effectiveRoles.includes('admin') || effectiveRoles.includes('super_admin');

  const { data: assignments } = isAdmin
    ? { data: [] as { program_id: string }[] }
    : await db.from('program_instructors').select('program_id').eq('instructor_id', user.id);
  const programIds = (assignments ?? []).map((row) => row.program_id).filter(Boolean);

  const enrollmentQuery = db
    .from('program_enrollments')
    .select('id,user_id,status,program_id,profiles(id,full_name,email),programs(title)')
    .order('created_at', { ascending: false })
    .limit(250);
  const { data: enrollments } =
    !isAdmin && programIds.length === 0
      ? { data: [] as any[] }
      : await (isAdmin ? enrollmentQuery : enrollmentQuery.in('program_id', programIds));

  const enrollmentIds = (enrollments ?? []).map((row: any) => row.id);
  const { data: reports } = enrollmentIds.length
    ? await db
        .from('instructor_progress_reports')
        .select('program_enrollment_id,instructional_hours')
        .in('program_enrollment_id', enrollmentIds)
    : { data: [] as any[] };
  const hourTotals = new Map<string, number>();
  for (const report of reports ?? []) {
    hourTotals.set(
      report.program_enrollment_id,
      (hourTotals.get(report.program_enrollment_id) ?? 0) + Number(report.instructional_hours || 0),
    );
  }

  const students = (enrollments ?? [])
    .filter((row: any) => row.user_id)
    .map((row: any) => ({
      enrollmentId: row.id,
      studentId: row.user_id,
      name: row.profiles?.full_name?.trim() || row.profiles?.email || 'Student',
      email: row.profiles?.email || '',
      programId: row.program_id,
      programName: row.programs?.title || 'Program',
      enrollmentStatus: row.status || 'enrolled',
      reportedHours: hourTotals.get(row.id) ?? 0,
    }));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/instructor/dashboard"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Instructor dashboard
      </Link>
      <div className="mb-8 mt-4">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-blue-700" />
          <h1 className="text-3xl font-black text-slate-950">48-Hour Student Progress Forms</h1>
        </div>
        <p className="mt-3 max-w-3xl font-medium leading-7 text-slate-700">
          Document each student’s training hours, what they learned, hands-on work, competencies,
          and testing readiness. Both active and completed students remain available so earlier
          records can be completed.
        </p>
      </div>
      <ProgressReportClient students={students} />
    </main>
  );
}
