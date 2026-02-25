import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/jri' },
  title: 'JRI Management | Elevate For Humanity',
  description: 'Manage Justice Reinvestment Initiative programs and participants.',
};

export default async function JRIPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { count: totalParticipants } = await db.from('jri_participants').select('*', { count: 'exact', head: true });
  const { count: activeParticipants } = await db.from('jri_participants').select('*', { count: 'exact', head: true }).eq('status', 'active');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">JRI</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Justice Reinvestment Initiative</h1>
          <p className="text-gray-600 mt-2">Manage JRI program participants and outcomes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Total Participants</h3><p className="text-3xl font-bold text-gray-900 mt-2">{totalParticipants || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Active</h3><p className="text-3xl font-bold text-brand-green-600 mt-2">{activeParticipants || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Completion Rate</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">78%</p></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6"><h2 className="text-lg font-semibold mb-4">Program Overview</h2><p className="text-gray-500">JRI participant data and program management tools</p></div>
      </div>
    </div>
  );
}
