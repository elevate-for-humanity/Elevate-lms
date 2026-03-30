import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Users, BookOpen, TrendingUp, Settings, BarChart3, Calendar, DollarSign } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const metadata: Metadata = {
  title: 'Program Holder Portal | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ProgramHolderDashboardPage() {
  const { db, programIds } = await requireProgramHolder();

  // Fetch programs this holder can access via program_holder_programs
  const { data: programsData } = programIds.length > 0
    ? await db
        .from('programs')
        .select('id, name, title, is_active, enrolled_count, completion_rate, created_at')
        .in('id', programIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  const programs = (programsData || []).map(p => ({
    id: p.id,
    name: p.name || p.title || 'Untitled Program',
    students: p.enrolled_count || 0,
    completion: p.completion_rate || 0,
    isActive: p.is_active,
  }));

  const totalStudents = programs.reduce((sum, p) => sum + p.students, 0);
  const activePrograms = programs.filter(p => p.isActive).length;
  const avgCompletion = programs.length > 0
    ? Math.round(programs.reduce((sum, p) => sum + p.completion, 0) / programs.length)
    : 0;

  const stats = [
    { label: 'Active Students', value: totalStudents.toLocaleString(), icon: Users },
    { label: 'Programs', value: programs.length.toString(), icon: BookOpen },
    { label: 'Completion Rate', value: `${avgCompletion}%`, icon: TrendingUp },
    { label: 'Active Programs', value: activePrograms.toString(), icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Program Holder Dashboard' }]} />

      {/* Hero banner */}
      <div className="relative h-48 sm:h-64 w-full overflow-hidden">
        <Image
          src="/images/pages/workforce-training.jpg"
          alt="Program Holder Portal"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
            <div>
              <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-1">Elevate For Humanity</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Program Holder Portal</h1>
            </div>
            <Link href="/program-holder/settings" className="p-2 text-white/80 hover:text-white">
              <Settings className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-8 h-8 text-brand-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Program Performance</h2>
                <Link href="/program-holder/analytics" className="text-brand-blue-600 hover:underline text-sm">View All</Link>
              </div>
              {programs.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3">Program</th>
                      <th className="pb-3 text-center">Students</th>
                      <th className="pb-3 text-center">Completion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {programs.slice(0, 6).map((program) => (
                      <tr key={program.id} className="hover:bg-white">
                        <td className="py-4">
                          <Link href={`/program-holder/programs/${program.id}`} className="font-medium text-brand-blue-600 hover:underline">
                            {program.name}
                          </Link>
                        </td>
                        <td className="py-4 text-center text-gray-600">{program.students}</td>
                        <td className="py-4 text-center">
                          <span className="text-brand-green-600 font-medium">{program.completion}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No programs yet. Create your first program to get started.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/program-holder/programs" className="flex items-center gap-3 p-3 bg-brand-blue-50 rounded-lg text-brand-blue-700 hover:bg-brand-blue-100">
                  <BookOpen className="w-5 h-5" /> Add New Program
                </Link>
                <Link href="/program-holder/students" className="flex items-center gap-3 p-3 bg-white rounded-lg text-gray-700 hover:bg-white">
                  <Users className="w-5 h-5" /> Manage Students
                </Link>
                <Link href="/program-holder/reports" className="flex items-center gap-3 p-3 bg-white rounded-lg text-gray-700 hover:bg-white">
                  <BarChart3 className="w-5 h-5" /> View Reports
                </Link>
                <Link href="/program-holder/payroll" className="flex items-center gap-3 p-3 bg-brand-green-50 rounded-lg text-brand-green-700 hover:bg-brand-green-100">
                  <DollarSign className="w-5 h-5" /> Payroll &amp; Payouts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
