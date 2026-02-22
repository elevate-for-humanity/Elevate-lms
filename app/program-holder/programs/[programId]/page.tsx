import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  BookOpen,
  Calendar,
  DollarSign,
  Settings,
  BarChart3,
  Edit,
  UserPlus,
  FileText,
  Clock,
  AlertCircle,
CheckCircle, } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ programId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { programId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  if (!supabase) return { title: 'Program | Program Holder' };
  
  const { data: program } = await db
    .from('programs')
    .select('name')
    .eq('id', programId)
    .single();

  return {
    title: program ? `${program.name} | Program Holder` : 'Program | Program Holder',
    robots: { index: false, follow: false },
  };
}

export default async function ProgramHolderProgramPage({ params }: Props) {
  const { programId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Programs" }]} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify program holder access
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'program_holder' && profile?.role !== 'admin') {
    redirect('/unauthorized');
  }

  // Fetch program
  const { data: program, error } = await db
    .from('programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (error || !program) notFound();

  // Fetch enrollments
  const { data: enrollments, count: enrollmentCount } = await db
    .from('enrollments')
    .select('*, profiles(first_name, last_name, email)', { count: 'exact' })
    .eq('program_id', programId)
    .order('enrolled_at', { ascending: false })
    .limit(10);

  // Fetch courses in program
  const { data: courses, count: courseCount } = await db
    .from('courses')
    .select('*', { count: 'exact' })
    .eq('program_id', programId);

  // Stats
  const activeEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;
  const completedEnrollments = enrollments?.filter(e => e.status === 'completed').length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Programs" }]} />
        </div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/program-holder/programs"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Programs
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{program.name}</h1>
            <p className="text-slate-600">{program.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                program.status === 'active' ? 'bg-brand-green-100 text-brand-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {program.status || 'Active'}
              </span>
              {program.duration_weeks && (
                <span className="text-sm text-slate-500">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {program.duration_weeks} weeks
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/program-holder/programs/${programId}/edit`}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <Edit className="w-4 h-4" />
              Edit Program
            </Link>
            <Link
              href={`/program-holder/programs/${programId}/enroll`}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <UserPlus className="w-4 h-4" />
              Enroll Student
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{enrollmentCount || 0}</p>
              <p className="text-sm text-slate-600">Total Enrolled</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeEnrollments}</p>
              <p className="text-sm text-slate-600">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{courseCount || 0}</p>
              <p className="text-sm text-slate-600">Courses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{completedEnrollments}</p>
              <p className="text-sm text-slate-600">Completed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Enrollments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Enrollments</h2>
            <Link href={`/program-holder/programs/${programId}/students`} className="text-sm text-brand-blue-600 hover:underline">
              View All
            </Link>
          </div>
          {enrollments && enrollments.length > 0 ? (
            <div className="space-y-3">
              {enrollments.map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-blue-600 font-semibold">
                        {enrollment.profiles?.first_name?.[0]}{enrollment.profiles?.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {enrollment.profiles?.first_name} {enrollment.profiles?.last_name}
                      </p>
                      <p className="text-sm text-slate-600">{enrollment.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{enrollment.progress || 0}%</p>
                    <p className="text-xs text-slate-500">{enrollment.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No enrollments yet</p>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Program Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Program Details</h2>
            <div className="space-y-3">
              {program.price && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Price</p>
                    <p className="font-medium text-slate-900">${program.price}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-600">Created</p>
                  <p className="font-medium text-slate-900">
                    {new Date(program.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/program-holder/programs/${programId}/reports`}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg"
              >
                <BarChart3 className="w-5 h-5 text-slate-500" />
                <span>View Reports</span>
              </Link>
              <Link
                href={`/program-holder/programs/${programId}/courses`}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg"
              >
                <BookOpen className="w-5 h-5 text-slate-500" />
                <span>Manage Courses</span>
              </Link>
              <Link
                href={`/program-holder/programs/${programId}/settings`}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg"
              >
                <Settings className="w-5 h-5 text-slate-500" />
                <span>Program Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
