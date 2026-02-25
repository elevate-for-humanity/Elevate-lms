import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/workforce-board/training' },
  title: 'Training Programs | Elevate For Humanity',
  description: 'Oversee training programs and provider relationships.',
};

export default async function TrainingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: programs, count } = await db.from('programs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(20);
  const { count: activeCount } = await db.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/employer-hero.jpg" alt="Workforce board" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/workforce-board" className="hover:text-primary">Workforce Board</Link></li><li>/</li><li className="text-gray-900 font-medium">Training</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">Training Programs</h1><p className="text-gray-600 mt-2">Manage training programs and providers</p></div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Add Program</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Total Programs</h3><p className="text-3xl font-bold text-gray-900 mt-2">{count || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Active</h3><p className="text-3xl font-bold text-brand-green-600 mt-2">{activeCount || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Participants</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">847</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Completion Rate</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">76%</p></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b"><h2 className="font-semibold">Training Programs</h2></div>
          <div className="divide-y">
            {programs && programs.length > 0 ? programs.map((prog: any) => (
              <div key={prog.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div><p className="font-medium">{prog.title}</p><p className="text-sm text-gray-500">{prog.provider || 'Provider'} • {prog.duration || 'Duration N/A'}</p></div>
                <span className={`px-2 py-1 rounded-full text-xs ${prog.status === 'active' ? 'bg-brand-green-100 text-brand-green-800' : 'bg-gray-100 text-gray-600'}`}>{prog.status || 'draft'}</span>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No programs found</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
