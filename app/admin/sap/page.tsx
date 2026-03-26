import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {

  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  FileText,
  Download,
  Filter,
  Search,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'SAP Monitoring | Admin Dashboard',
  description: 'Monitor Satisfactory Academic Progress for all students',
};

export default async function SAPMonitoringPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/sap');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/dashboard');
  }

  // Get all active enrollments with student and program data
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(
      `
      *,
      student:profiles!enrollments_student_id_fkey(id, full_name, email),
      program:programs(name, total_hours)
    `
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Calculate SAP status for each student
  const studentsWithSAP = await Promise.all(
    (enrollments || []).map(async (enrollment) => {
      // Get grades
      const { data: grades } = await supabase
        .from('grades')
        .select('percentage')
        .eq('enrollment_id', enrollment.id);

      // Calculate GPA
      const avgPercentage =
        grades && grades.length > 0
          ? grades.reduce((sum, g) => sum + (g.percentage || 0), 0) /
            grades.length
          : 0;

      const gpa =
        avgPercentage >= 90
          ? 4.0
          : avgPercentage >= 80
            ? 3.0
            : avgPercentage >= 70
              ? 2.0
              : avgPercentage >= 60
                ? 1.0
                : 0.0;

      // Get attendance
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('enrollment_id', enrollment.id);

      const totalDays = attendance?.length || 0;
      const presentDays =
        attendance?.filter(
          (a) => a.status === 'present' || a.status === 'excused'
        ).length || 0;
      const attendanceRate =
        totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

      // Calculate completion rate
      const progressPercentage = enrollment.progress_percentage || 0;
      const startDate = new Date(enrollment.start_date);
      const today = new Date();
      const daysSinceStart = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const expectedDuration = 365; // Default 1 year, should come from program
      const expectedProgress = Math.min(
        (daysSinceStart / expectedDuration) * 100,
        100
      );
      const completionRate =
        expectedProgress > 0
          ? (progressPercentage / expectedProgress) * 100
          : 100;

      // Determine SAP status
      const meetsGPA = gpa >= 2.0;
      const meetsAttendance = attendanceRate >= 80;
      const meetsCompletion = completionRate >= 67;
      const meetsSAP = meetsGPA && meetsAttendance && meetsCompletion;

      // Determine warning level
      let status: 'good' | 'warning' | 'probation' | 'suspension';
      if (meetsSAP) {
        status = 'good';
      } else if (gpa >= 1.5 && attendanceRate >= 70 && completionRate >= 50) {
        status = 'warning';
      } else if (gpa >= 1.0 && attendanceRate >= 60 && completionRate >= 40) {
        status = 'probation';
      } else {
        status = 'suspension';
      }

      return {
        enrollmentId: enrollment.id,
        studentId: enrollment.student?.id,
        studentName: enrollment.student?.full_name || 'Unknown',
        studentEmail: enrollment.student?.email || '',
        programName: enrollment.program?.name || 'Unknown Program',
        gpa: Math.round(gpa * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        progressPercentage,
        status,
        meetsGPA,
        meetsAttendance,
        meetsCompletion,
        startDate: enrollment.start_date,
      };
    })
  );

  // Calculate summary statistics
  const totalStudents = studentsWithSAP.length;
  const goodStanding = studentsWithSAP.filter(
    (s) => s.status === 'good'
  ).length;
  const warnings = studentsWithSAP.filter((s) => s.status === 'warning').length;
  const probation = studentsWithSAP.filter(
    (s) => s.status === 'probation'
  ).length;
  const suspension = studentsWithSAP.filter(
    (s) => s.status === 'suspension'
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-brand-green-100 text-brand-green-800 border-brand-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'probation':
        return 'bg-brand-orange-100 text-brand-orange-800 border-brand-orange-200';
      case 'suspension':
        return 'bg-brand-red-100 text-brand-red-800 border-brand-red-200';
      default:
        return 'bg-gray-100 text-black border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <span className="text-slate-400 flex-shrink-0">•</span>;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'probation':
        return <TrendingDown className="w-5 h-5 text-brand-orange-600" />;
      case 'suspension':
        return <AlertTriangle className="w-5 h-5 text-brand-orange-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero Image */}
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Sap' }]} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Satisfactory Academic Progress (SAP)
              </h1>
              <p className="text-black mt-1">
                Monitor student academic standing and compliance
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 text-black hover:text-black border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors" aria-label="Action button">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
              <Link
                href="/admin"
                className="px-4 py-2 text-black hover:text-black font-medium transition-colors"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-brand-blue-600" />
              <span className="text-3xl font-bold text-black">
                {totalStudents}
              </span>
            </div>
            <div className="text-sm text-black">Total Students</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span className="text-3xl font-bold text-brand-green-600">
                {goodStanding}
              </span>
            </div>
            <div className="text-sm text-black">Good Standing</div>
            <div className="text-xs text-slate-500 mt-1">
              {totalStudents > 0
                ? Math.round((goodStanding / totalStudents) * 100)
                : 0}
              %
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <span className="text-3xl font-bold text-yellow-600">
                {warnings}
              </span>
            </div>
            <div className="text-sm text-black">Warning</div>
            <div className="text-xs text-slate-500 mt-1">
              {totalStudents > 0
                ? Math.round((warnings / totalStudents) * 100)
                : 0}
              %
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-brand-orange-600" />
              <span className="text-3xl font-bold text-brand-orange-600">
                {probation}
              </span>
            </div>
            <div className="text-sm text-black">Probation</div>
            <div className="text-xs text-slate-500 mt-1">
              {totalStudents > 0
                ? Math.round((probation / totalStudents) * 100)
                : 0}
              %
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-brand-orange-600" />
              <span className="text-3xl font-bold text-brand-orange-600">
                {suspension}
              </span>
            </div>
            <div className="text-sm text-black">At Risk</div>
            <div className="text-xs text-slate-500 mt-1">
              {totalStudents > 0
                ? Math.round((suspension / totalStudents) * 100)
                : 0}
              %
            </div>
          </div>
        </div>

        {/* SAP Requirements */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-brand-blue-900 mb-4">
            SAP Requirements
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-brand-blue-900 mb-2">
                GPA Requirement
              </h3>
              <p className="text-brand-blue-800 text-sm mb-1">
                Minimum: 2.0 (C average)
              </p>
              <p className="text-brand-blue-700 text-xs">
                Students below 2.0 GPA are placed on warning
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-brand-blue-900 mb-2">
                Attendance Requirement
              </h3>
              <p className="text-brand-blue-800 text-sm mb-1">
                Minimum: 80% attendance
              </p>
              <p className="text-brand-blue-700 text-xs">
                Excessive absences may result in dismissal
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-brand-blue-900 mb-2">
                Completion Rate
              </h3>
              <p className="text-brand-blue-800 text-sm mb-1">
                Minimum: 67% of coursework
              </p>
              <p className="text-brand-blue-700 text-xs">
                Must complete within 150% of program length
              </p>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-slate-50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-black">
                Student SAP Status
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-black hover:text-black border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm" aria-label="Action button">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    GPA
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Completion
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {studentsWithSAP.map((student: any) => (
                  <tr key={student.enrollmentId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-black">
                          {student.studentName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {student.studentEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black">
                        {student.programName}
                      </div>
                      <div className="text-xs text-slate-500">
                        Started{' '}
                        {new Date(student.startDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div
                        className={`text-sm font-semibold ${student.meetsGPA ? 'text-brand-green-600' : 'text-brand-orange-600'}`}
                      >
                        {student.gpa.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {student.meetsGPA ? '• Meets' : '✗ Below'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div
                        className={`text-sm font-semibold ${student.meetsAttendance ? 'text-brand-green-600' : 'text-brand-orange-600'}`}
                      >
                        {student.attendanceRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500">
                        {student.meetsAttendance ? '• Meets' : '✗ Below'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div
                        className={`text-sm font-semibold ${student.meetsCompletion ? 'text-brand-green-600' : 'text-brand-orange-600'}`}
                      >
                        {student.completionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500">
                        {student.meetsCompletion ? '• Meets' : '✗ Below'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold border ${getStatusColor(student.status)}`}
                      >
                        {getStatusIcon(student.status)}
                        {student.status.charAt(0).toUpperCase() +
                          student.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        href={`/admin/students/${student.studentId}`}
                        className="text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Items */}
        {warnings + probation + suspension > 0 && (
          <div className="mt-8 bg-brand-orange-50 border border-brand-orange-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-brand-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-brand-orange-900 mb-2">
                  Action Required: {warnings + probation + suspension} Students
                  Need Intervention
                </h3>
                <p className="text-brand-orange-800 mb-4">
                  Students not meeting SAP requirements need immediate attention
                  to prevent dismissal.
                </p>
                <ul className="space-y-2 text-brand-orange-800 text-sm">
                  {warnings > 0 && (
                    <li>
                      • {warnings} students on warning - schedule academic
                      counseling
                    </li>
                  )}
                  {probation > 0 && (
                    <li>
                      • {probation} students on probation - create improvement
                      plans
                    </li>
                  )}
                  {suspension > 0 && (
                    <li>
                      • {suspension} students at risk - immediate intervention
                      required
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
