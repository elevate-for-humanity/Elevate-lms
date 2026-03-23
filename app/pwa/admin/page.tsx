import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminInstallPrompt } from '@/components/pwa/AdminInstallPrompt';

async function getAdminDashboardData() {
  const supabase = createAdminClient();
  if (!supabase) return { profiles: 0, applications: 0, enrollments: 0, courses: 0, programs: 0, products: 0, recentApps: [], recentEnrollments: [] };

  const [profileRes, appRes, enrollRes, courseRes, programRes, productRes, recentAppsRes, recentEnrollRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('applications').select('id', { count: 'exact', head: true }),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('programs').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('applications').select('id, first_name, last_name, email, status, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('enrollments').select('id, user_id, course_id, status, enrolled_at').order('enrolled_at', { ascending: false }).limit(5),
  ]);

  return {
    profiles: profileRes.count || 0,
    applications: appRes.count || 0,
    enrollments: enrollRes.count || 0,
    courses: courseRes.count || 0,
    programs: programRes.count || 0,
    products: productRes.count || 0,
    recentApps: recentAppsRes.data || [],
    recentEnrollments: recentEnrollRes.data || [],
  };
}

export default async function AdminPWAPage() {
  const data = await getAdminDashboardData();

  const stats = [
    { label: 'Users', value: data.profiles, color: 'bg-brand-blue-600', href: '/admin/users' },
    { label: 'Applications', value: data.applications, color: 'bg-brand-orange-500', href: '/admin/applications' },
    { label: 'Enrollments', value: data.enrollments, color: 'bg-brand-green-600', href: '/admin/enrollments' },
    { label: 'Courses', value: data.courses, color: 'bg-purple-600', href: '/admin/courses' },
    { label: 'Programs', value: data.programs, color: 'bg-teal-600', href: '/admin/programs' },
    { label: 'Products', value: data.products, color: 'bg-amber-600', href: '/admin/store' },
  ];

  return (
    <>
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative h-48 sm:h-56">
        <Image src="/images/pages/demo-page-1.jpg" alt="Elevate admin portal" fill className="object-cover" priority />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <Image src="/logo.png" alt="Elevate" width={40} height={40} className="mb-3" />
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-brand-red-200 text-sm mt-1">Manage users, programs, and operations</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 px-4 -mt-6 relative z-10">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl shadow-sm p-3 text-center hover:shadow-md transition-shadow">
            <div className={`text-2xl font-bold text-white ${s.color} w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-1 text-sm`}>{s.value}</div>
            <div className="text-xs text-slate-600 font-medium">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin" className="bg-brand-red-600 text-white rounded-xl p-4 text-center font-semibold text-sm hover:bg-brand-red-700">
            Full Admin Panel →
          </Link>
          <Link href="/admin/applications" className="bg-brand-orange-500 text-white rounded-xl p-4 text-center font-semibold text-sm hover:bg-brand-orange-600">
            Review Apps →
          </Link>
          <Link href="/admin/enrollments" className="bg-brand-green-600 text-white rounded-xl p-4 text-center font-semibold text-sm hover:bg-brand-green-700">
            Enrollments →
          </Link>
          <Link href="/admin/users" className="bg-brand-blue-600 text-white rounded-xl p-4 text-center font-semibold text-sm hover:bg-brand-blue-700">
            Manage Users →
          </Link>
          <Link href="/admin/courses" className="bg-purple-600 text-white rounded-xl p-4 text-center font-semibold text-sm hover:bg-purple-700 col-span-2">
            Course Management →
          </Link>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Recent Applications</h2>
        <div className="space-y-2">
          {data.recentApps.length === 0 && <p className="text-slate-500 text-sm bg-white rounded-xl p-4">No applications yet.</p>}
          {data.recentApps.map((app: any) => (
            <div key={app.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${app.status === 'approved' ? 'bg-brand-green-500' : app.status === 'pending' ? 'bg-amber-500' : 'bg-slate-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm truncate">{[app.first_name, app.last_name].filter(Boolean).join(' ') || 'Unknown'}</div>
                <div className="text-xs text-slate-500">{app.email}</div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${app.status === 'approved' ? 'bg-brand-green-100 text-brand-green-700' : app.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                {app.status || 'new'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Enrollments */}
      <div className="px-4 mt-6 pb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Recent Enrollments</h2>
        <div className="space-y-2">
          {data.recentEnrollments.length === 0 && <p className="text-slate-500 text-sm bg-white rounded-xl p-4">No enrollments yet.</p>}
          {data.recentEnrollments.map((e: any) => (
            <div key={e.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.status === 'active' ? 'bg-brand-green-500' : e.status === 'completed' ? 'bg-brand-blue-500' : 'bg-slate-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm truncate">Enrollment #{e.id.slice(0, 8)}</div>
                <div className="text-xs text-slate-500">{new Date(e.enrolled_at).toLocaleDateString()}</div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${e.status === 'active' ? 'bg-brand-green-100 text-brand-green-700' : e.status === 'completed' ? 'bg-brand-blue-100 text-brand-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                {e.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
    <AdminInstallPrompt />
    </>
  );
}
