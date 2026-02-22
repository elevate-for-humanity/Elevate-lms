import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, BookOpen, TrendingUp, Settings, BarChart3, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Program Holder Portal | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ProgramHolderDashboardPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    redirect('/login?redirect=/program-holder/dashboard');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/program-holder/dashboard');
  }

  // Fetch programs owned by this user
  const { data: programsData } = await db
    .from('programs')
    .select('id, name, title, is_active, enrolled_count, completion_rate, created_at')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  const programs = (programsData || []).map(p => ({
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
    <div className="min-h-screen bg-gray-100">
      <Breadcrumbs items={[{ label: 'Program Holder Dashboard' }]} />

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-brand-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Program Holder Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/program-holder/settings" className="p-2 text-gray-600 hover:text-brand-blue-600">
                <Settings className="w-6 h-6" />
              </Link>
            </div>
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
                    {programs.slice(0, 6).map((program, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-4 font-medium text-gray-900">{program.name}</td>
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
                <Link href="/program-holder/programs/new" className="flex items-center gap-3 p-3 bg-brand-blue-50 rounded-lg text-brand-blue-700 hover:bg-brand-blue-100">
                  <BookOpen className="w-5 h-5" /> Add New Program
                </Link>
                <Link href="/program-holder/students" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100">
                  <Users className="w-5 h-5" /> Manage Students
                </Link>
                <Link href="/program-holder/reports" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100">
                  <BarChart3 className="w-5 h-5" /> View Reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
