import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/external-modules/approvals' },
  title: 'Module Approvals | Elevate For Humanity',
  description: 'Review and approve external learning modules.',
};

export default async function ModuleApprovalsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: modules, count } = await db.from('external_modules').select('*', { count: 'exact' }).eq('status', 'pending').order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-external-modules-approvals-hero.jpg" alt="Program administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/external-modules" className="hover:text-primary">External Modules</Link></li><li>/</li><li className="text-gray-900 font-medium">Approvals</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Module Approvals</h1>
          <p className="text-gray-600 mt-2">{count || 0} modules pending review</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y">
            {modules && modules.length > 0 ? modules.map((module: any) => (
              <div key={module.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div><p className="font-medium">{module.title}</p><p className="text-sm text-gray-500">{module.provider} • Submitted {new Date(module.created_at).toLocaleDateString()}</p></div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-brand-green-600 text-white rounded text-sm hover:bg-brand-green-700">Approve</button>
                  <button className="px-3 py-1 bg-brand-red-600 text-white rounded text-sm hover:bg-brand-red-700">Reject</button>
                </div>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No modules pending approval</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
