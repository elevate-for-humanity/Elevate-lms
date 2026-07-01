'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  Award,
  Building2,
  DollarSign,
  TrendingUp,
  FileText,
  Activity,
  Settings,
  ChevronRight,
  Clock
} from 'lucide-react';

interface SystemStats {
  totalStudents: number;
  activeEnrollments: number;
  completedPrograms: number;
  pendingApplications: number;
  activeEmployers: number;
  revenue: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<{ id: string; email?: string; full_name?: string } | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // Fetch system stats
      try {
        const [studentsRes, enrollmentsRes, appsRes, employersRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('employers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        ]);

        setStats({
          totalStudents: studentsRes.count || 0,
          activeEnrollments: enrollmentsRes.count || 0,
          completedPrograms: 0,
          pendingApplications: appsRes.count || 0,
          activeEmployers: employersRes.count || 0,
          revenue: 0,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
      
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid md:grid-cols-4 gap-6">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">System overview and quick actions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={Users} label="Students" value={stats?.totalStudents || 0} href="/admin/students" />
          <StatCard icon={GraduationCap} label="Enrollments" value={stats?.activeEnrollments || 0} href="/admin/enrollments" />
          <StatCard icon={Award} label="Completed" value={stats?.completedPrograms || 0} href="/admin/certificates" />
          <StatCard icon={FileText} label="Applications" value={stats?.pendingApplications || 0} href="/admin/applications" alert={(stats?.pendingApplications || 0) > 0} />
          <StatCard icon={Building2} label="Employers" value={stats?.activeEmployers || 0} href="/admin/employers" />
          <StatCard icon={DollarSign} label="Revenue" value="$0" href="/admin/reports" />
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <QuickAction icon={Users} label="Manage Students" href="/admin/students" />
          <QuickAction icon={Briefcase} label="View Applications" href="/admin/applications" />
          <QuickAction icon={TrendingUp} label="View Reports" href="/admin/reports" />
          <QuickAction icon={Settings} label="System Settings" href="/admin/settings" />
        </div>

        {/* Management Sections */}
        <h2 className="text-xl font-bold text-slate-900 mb-4">Management</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ManagementCard title="Students & Enrollment" items={[
            { label: 'All Students', href: '/admin/students' },
            { label: 'Enrollments', href: '/admin/enrollments' },
            { label: 'Programs', href: '/admin/programs' },
            { label: 'Certificates', href: '/admin/certificates' },
          ]} />
          <ManagementCard title="Applications & CRM" items={[
            { label: 'Applications', href: '/admin/applications' },
            { label: 'Leads', href: '/admin/crm/leads' },
            { label: 'Contracts', href: '/admin/contracts' },
            { label: 'At-Risk Students', href: '/admin/at-risk' },
          ]} />
          <ManagementCard title="Operations" items={[
            { label: 'Courses', href: '/admin/courses' },
            { label: 'Grants', href: '/admin/grants' },
            { label: 'Integrations', href: '/admin/integrations' },
            { label: 'Monitoring', href: '/admin/monitoring' },
          ]} />
        </div>

        {/* System Health */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">System Health</h2>
            <Link href="/admin/system-health" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Details →
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-600">All systems operational</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Last checked: Just now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, href, alert }: { 
  icon: React.ElementType; 
  label: string; 
  value: number | string;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link href={href} className={`rounded-xl border p-4 hover:shadow-md transition ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
      <Icon className={`w-6 h-6 mb-2 ${alert ? 'text-red-600' : 'text-blue-600'}`} />
      <div className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-slate-900'}`}>{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </Link>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-md transition group">
      <Icon className="w-8 h-8 text-blue-600" />
      <span className="font-medium text-slate-900 group-hover:text-blue-600">{label}</span>
      <ChevronRight className="w-5 h-5 text-slate-400 ml-auto group-hover:text-blue-600 group-hover:translate-x-1 transition" />
    </Link>
  );
}

function ManagementCard({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-2">
        {items.map(item => (
          <Link 
            key={item.href} 
            href={item.href} 
            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition"
          >
            <span className="text-sm text-slate-700">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
