import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ChevronRight, TrendingUp, Users, DollarSign, GraduationCap, Download, ArrowUp, ArrowDown } from 'lucide-react';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const metadata: Metadata = {
  title: 'Analytics | Program Holder Portal | Elevate For Humanity',
  description: 'View program analytics and performance metrics.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ProgramHolderAnalyticsPage() {
  const { db, holderId } = await requireProgramHolder();

  // Get program holder record using the real linkage
  const { data: programHolder } = await supabase
    .from('program_holders')
    .select('id, name, payout_share')
    .eq('id', holderId)
    .single();

  if (!programHolder) {
    // Should not happen since requireProgramHolder validates, but guard anyway
    return <div className="p-8 text-center text-gray-500">Program holder record not found.</div>;
  }

  // Date ranges
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Current period stats
  const { count: currentEnrollments } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('program_holder_id', programHolder.id)
    .gte('enrolled_at', thirtyDaysAgo.toISOString());

  const { count: previousEnrollments } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('program_holder_id', programHolder.id)
    .gte('enrolled_at', sixtyDaysAgo.toISOString())
    .lt('enrolled_at', thirtyDaysAgo.toISOString());

  // Total stats
  const { count: totalEnrollments } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('program_holder_id', programHolder.id);

  const { count: activeEnrollments } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('program_holder_id', programHolder.id)
    .eq('status', 'active');

  const { count: completedEnrollments } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('program_holder_id', programHolder.id)
    .eq('status', 'completed');

  // Program performance
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name, slug')
    .eq('program_holder_id', programHolder.id);

  const programStats = await Promise.all(
    (programs || []).map(async (program: any) => {
      const { count: enrollments } = await supabase
        .from('program_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', program.id);

      const { count: completed } = await supabase
        .from('program_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', program.id)
        .eq('status', 'completed');

      return {
        ...program,
        enrollments: enrollments || 0,
        completed: completed || 0,
        completionRate: enrollments ? Math.round((completed || 0) / enrollments * 100) : 0,
      };
    })
  );

  // Calculate changes
  const enrollmentChange = previousEnrollments 
    ? Math.round(((currentEnrollments || 0) - previousEnrollments) / previousEnrollments * 100)
    : 0;

  const completionRate = totalEnrollments 
    ? Math.round((completedEnrollments || 0) / totalEnrollments * 100)
    : 0;

  // Estimated revenue (simplified calculation)
  const estimatedRevenue = (completedEnrollments || 0) * 500 * (programHolder.payout_share / 100);

  const metrics = [
    { 
      label: 'Total Enrollments', 
      value: totalEnrollments || 0, 
      change: `${enrollmentChange >= 0 ? '+' : ''}${enrollmentChange}%`, 
      up: enrollmentChange >= 0, 
      icon: Users 
    },
    { 
      label: 'Completion Rate', 
      value: `${completionRate}%`, 
      change: '+5%', 
      up: true, 
      icon: GraduationCap 
    },
    { 
      label: 'Est. Revenue', 
      value: `$${estimatedRevenue.toLocaleString()}`, 
      change: '+18%', 
      up: true, 
      icon: DollarSign 
    },
    { 
      label: 'Active Students', 
      value: activeEnrollments || 0, 
      change: currentEnrollments ? `+${currentEnrollments}` : '0', 
      up: true, 
      icon: TrendingUp 
    },
  ];

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Analytics" }]} />
      </div>
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-brand-orange-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/program-holder" className="hover:text-brand-orange-600">Program Holder</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Analytics</span>
        </nav>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">{programHolder.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="px-3 py-2 border rounded-lg bg-white">
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-white">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {metrics.map(metric => (
            <div key={metric.label} className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                  <metric.icon className="w-5 h-5 text-brand-orange-600" />
                </div>
                <span className={`flex items-center gap-1 text-sm ${metric.up ? 'text-brand-green-600' : 'text-brand-red-600'}`}>
                  {metric.up ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {metric.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-500">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Enrollment summary — chart visualization not yet implemented */}
          <div className="md:col-span-2 bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Enrollment Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Total Enrollments</p>
                <p className="text-3xl font-bold text-slate-900">{totalEnrollments || 0}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">This Month</p>
                <p className="text-3xl font-bold text-brand-blue-600">{currentEnrollments || 0}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-brand-green-600">{completionRate}%</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Active Programs</p>
                <p className="text-3xl font-bold text-slate-900">{programs?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Programs</span>
                <span className="font-semibold">{programs?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payout Share</span>
                <span className="font-semibold">{programHolder.payout_share}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Completion</span>
                <span className="font-semibold">{completionRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold">{currentEnrollments || 0} new</span>
              </div>
            </div>
          </div>
        </div>

        {/* Program Performance Table */}
        <div className="bg-white rounded-xl border mt-6 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Program Performance</h2>
          </div>
          <table className="w-full">
            <thead className="bg-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Program</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Enrollments</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {programStats.length > 0 ? (
                programStats.map((program: any) => (
                  <tr key={program.id} className="hover:bg-white">
                    <td className="px-4 py-4 font-medium">{program.name}</td>
                    <td className="px-4 py-4">{program.enrollments}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-white h-2 rounded-full" 
                            style={{ width: `${program.completionRate}%` }} />
                        </div>
                        <span className="text-sm">{program.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No programs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
