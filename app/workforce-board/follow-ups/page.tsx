import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/workforce-board/follow-ups' },
  title: 'Follow-Ups | Elevate For Humanity',
  description: 'Track and manage participant follow-up activities.',
};

export default async function FollowUpsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const followUps: any[] = [];
  const count = 0;
  const overdueCount = 0;

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/workforce-board-page-2.jpg" alt="Workforce board" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-black"><li><Link href="/workforce-board" className="hover:text-primary">Workforce Board</Link></li><li>/</li><li className="text-gray-900 font-medium">Follow-Ups</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">Follow-Ups</h1><p className="text-black mt-2">Track participant follow-up activities</p></div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Schedule Follow-Up</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-black">Total Follow-Ups</h3><p className="text-3xl font-bold text-gray-900 mt-2">{count || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-black">Overdue</h3><p className="text-3xl font-bold text-brand-red-600 mt-2">{overdueCount || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-black">Due This Week</h3><p className="text-3xl font-bold text-yellow-600 mt-2">12</p></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y">
            {followUps && followUps.length > 0 ? followUps.map((fu: any) => (
              <div key={fu.id} className="p-4 flex items-center justify-between hover:bg-white">
                <div><p className="font-medium">{fu.profiles?.full_name || 'Participant'}</p><p className="text-sm text-black">{fu.type} • Due: {fu.due_date ? new Date(fu.due_date).toLocaleDateString() : 'N/A'}</p></div>
                <span className={`px-2 py-1 rounded-full text-xs ${fu.status === 'completed' ? 'bg-brand-green-100 text-brand-green-800' : fu.status === 'overdue' ? 'bg-brand-red-100 text-brand-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{fu.status || 'pending'}</span>
              </div>
            )) : <div className="p-8 text-center text-black">No follow-ups scheduled</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
