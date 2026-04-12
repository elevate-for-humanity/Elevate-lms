import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AttendanceRecordForm from './AttendanceRecordForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Record Attendance | Staff Portal | Elevate For Humanity',
  description: 'Record student attendance.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function RecordAttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/staff-portal/attendance/record');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || !['staff', 'instructor', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  // Fetch active students with their enrollments
  const { data: rawAttendEnrollments } = await supabase
    .from('program_enrollments')
    .select(`id, user_id, program_id, program:programs(id, name, title)`)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false });

  // Hydrate student profiles separately (user_id → auth.users, no FK to profiles)
  const attendUserIds = [...new Set((rawAttendEnrollments ?? []).map((e: any) => e.user_id).filter(Boolean))];
  const { data: attendProfiles } = attendUserIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', attendUserIds)
    : { data: [] };
  const attendProfileMap = Object.fromEntries((attendProfiles ?? []).map((p: any) => [p.id, p]));
  const activeEnrollments = (rawAttendEnrollments ?? []).map((e: any) => ({
    ...e,
    student_id: e.user_id,
    student: attendProfileMap[e.user_id] ?? null,
  }));

  // Fetch today's attendance records
  const today = new Date().toISOString().split('T')[0];
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('student_id, status, check_in_time')
    .eq('date', today);

  // Create a map of student attendance
  const attendanceMap = new Map(
    todayAttendance?.map(a => [a.student_id, { status: a.status, checkIn: a.check_in_time }]) || []
  );

  // Format students for the form
  const students = activeEnrollments?.map((e: any) => ({
    id: e.student?.id,
    enrollmentId: e.id,
    name: e.student?.full_name || 'Unknown',
    email: e.student?.email,
    program: e.program?.name || 'N/A',
    programId: e.program_id,
    attended: attendanceMap.has(e.student?.id),
    status: attendanceMap.get(e.student?.id)?.status || null,
    checkIn: attendanceMap.get(e.student?.id)?.checkIn || null,
  })) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Staff Portal', href: '/staff-portal' }, { label: 'Attendance', href: '/staff-portal/attendance' }, { label: 'Record' }]} />
        </div>
      </div>

      <div className="py-8">
      <div className="max-w-5xl mx-auto px-4">

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Record Attendance</h1>
        <p className="text-gray-600 mb-8">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <AttendanceRecordForm 
          students={students}
          date={today}
          staffId={user.id}
        />
      </div>
      </div>
    </div>
  );
}
