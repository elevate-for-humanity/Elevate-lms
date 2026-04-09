import Image from 'next/image';
import Logo from '@/components/ui/Logo';
import Link from 'next/link';
import { getAdminClient } from '@/lib/supabase/admin';

async function getEmployerData() {
  const supabase = await getAdminClient();

  const [programRes, enrollRes, completedRes] = await Promise.all([
    supabase.from('programs').select('id, name, slug, category, placement_rate, completion_rate').eq('is_active', true).order('name').limit(20),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
  ]);

  return {
    programs: programRes.data || [],
    enrollments: enrollRes.count || 0,
    completedEnrollments: completedRes.count || 0,
  };
}

export default async function EmployerPWAPage() {
  const { programs, enrollments, completedEnrollments } = await getEmployerData();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <Image src="/images/pages/demo-page-2.jpg" alt="Employer partnership" fill className="object-cover" priority  sizes="100vw" />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <Logo alt="Elevate" width={40} height={40} className="mb-3" />
          <h1 className="text-2xl font-bold text-slate-900">Employer Portal</h1>
          <p className="text-emerald-200 text-sm mt-1">Hire trained, credentialed graduates</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-brand-green-600">{programs.length}</div>
          <div className="text-xs text-slate-500">Programs</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-brand-blue-600">{enrollments}</div>
          <div className="text-xs text-slate-500">In Training</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{completedEnrollments}</div>
          <div className="text-xs text-slate-500">Graduates</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/employer/dashboard" className="bg-brand-green-600 text-white rounded-xl p-4 text-center font-semibold text-sm hover:bg-brand-green-700">
            Full Portal →
          </Link>
          <Link href="/employer/opportunities" className="bg-brand-blue-600 text-white rounded-xl p-4 text-center font-semibold text-sm hover:bg-brand-blue-700">
            Post Position →
          </Link>
          <Link href="/employer/candidates" className="bg-white border border-slate-200 text-slate-900 rounded-xl p-4 text-center font-semibold text-sm hover:bg-white">
            View Candidates
          </Link>
          <Link href="/contact" className="bg-white border border-slate-200 text-slate-900 rounded-xl p-4 text-center font-semibold text-sm hover:bg-white">
            Contact Us
          </Link>
        </div>
      </div>

      {/* Available Programs */}
      <div className="px-4 mt-6 pb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Training Programs</h2>
        <p className="text-slate-600 text-sm mb-4">Graduates from these programs are available for hire.</p>
        <div className="space-y-2">
          {programs.slice(0, 10).map((prog: any) => (
            <Link key={prog.id} href={`/programs/${prog.slug}`} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3 hover:border-brand-green-300">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center text-brand-green-700 font-bold text-xs flex-shrink-0">
                {prog.category?.slice(0, 3).toUpperCase() || 'PRG'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm truncate">{prog.name}</div>
                <div className="text-xs text-slate-500">{prog.category}{prog.placement_rate ? ` · ${prog.placement_rate}% placement` : ''}</div>
              </div>
              <span className="text-slate-500 text-sm">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
