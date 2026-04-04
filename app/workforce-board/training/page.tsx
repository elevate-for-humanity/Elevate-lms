import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/workforce-board/training' },
  title: 'Training Programs | Elevate For Humanity',
  description: 'Oversee training programs and provider relationships.',
};

export default async function TrainingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: programs, count } = await supabase.from('programs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(20);
  const { count: activeCount } = await supabase.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active');
  const { count: participantCount } = await supabase.from('program_enrollments').select('*', { count: 'exact', head: true });
  const { count: completedCount } = await supabase.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed');
  const completionRate = participantCount && participantCount > 0
    ? Math.round((completedCount ?? 0) / participantCount * 100)
    : null;

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/workforce-board-page-7.jpg" alt="Workforce board" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-black"><li><Link href="/workforce-board" className="hover:text-primary">Workforce Board</Link></li><li>/</li><li className="text-gray-900 font-medium">Training</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">Training Programs</h1><p className="text-black mt-2">Manage training programs and providers</p></div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Add Program</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-black">Total Programs</h3><p className="text-3xl font-bold text-black mt-2">{count ?? 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-black">Active</h3><p className="text-3xl font-bold text-black mt-2">{activeCount ?? 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-black">Participants</h3><p className="text-3xl font-bold text-black mt-2">{participantCount ?? 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-black">Completion Rate</h3><p className="text-3xl font-bold text-black mt-2">{completionRate !== null ? `${completionRate}%` : '—'}</p></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b"><h2 className="font-semibold">Training Programs</h2></div>
          <div className="divide-y">
            {programs && programs.length > 0 ? programs.map((prog: any) => (
              <div key={prog.id} className="p-4 flex items-center justify-between hover:bg-white">
                <div><p className="font-medium">{prog.title}</p><p className="text-sm text-black">{prog.provider || 'Provider'} • {prog.duration || 'Duration N/A'}</p></div>
                <span className={`px-2 py-1 rounded-full text-xs ${prog.status === 'active' ? 'bg-brand-green-100 text-brand-green-800' : 'bg-white text-black'}`}>{prog.status || 'draft'}</span>
              </div>
            )) : <div className="p-8 text-center text-black">No programs found</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
