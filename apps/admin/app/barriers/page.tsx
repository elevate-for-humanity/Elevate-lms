import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { LearningBarrierAnalyzer } from '@/components/admin/LearningBarrierAnalyzer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Barriers Management | Elevate For Humanity',
  description: 'Track and manage participant barriers to employment and training.',
};

export default async function BarriersPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data: barriers, count: totalBarriers } = await supabase
    .from('participant_barriers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(20);

  const { count: resolvedBarriers } = await supabase
    .from('participant_barriers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'resolved');

  const { count: activeBarriers } = await supabase
    .from('participant_barriers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const barrierTypes = [
    { name: 'Transportation', icon: '🚗', description: 'Lack of reliable transportation' },
    { name: 'Childcare', icon: '👶', description: 'Need for childcare assistance' },
    { name: 'Housing', icon: '🏠', description: 'Housing instability or homelessness' },
    { name: 'Education', icon: '📚', description: 'Educational gaps or credentials' },
    { name: 'Health', icon: '🏥', description: 'Health or disability concerns' },
    { name: 'Legal', icon: '⚖️', description: 'Legal issues or background' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li><Link href="/" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Barriers</li>
            </ol>
          </nav>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Barriers Management</h1>
              <p className="text-slate-700 mt-2">Track and resolve participant barriers to success</p>
            </div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Add Barrier</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            ['Total Barriers', totalBarriers || 0, 'Documented barriers'],
            ['Active', activeBarriers || 0, 'Needs attention'],
            ['Resolved', resolvedBarriers || 0, 'Successfully addressed'],
          ].map(([label, value, detail]) => (
            <div key={String(label)} className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-slate-700">{label}</h3>
              <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
              <p className="text-sm text-slate-700 mt-1">{detail}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6 border-b"><h2 className="text-lg font-semibold">Barrier Categories</h2><p className="text-sm text-slate-700">Common barriers tracked in the system</p></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6">
            {barrierTypes.map((type) => <div key={type.name} className="p-4 border rounded-lg hover:bg-slate-50"><span className="text-2xl">{type.icon}</span><h3 className="font-medium mt-2">{type.name}</h3><p className="text-sm text-slate-700">{type.description}</p></div>)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b"><h2 className="text-lg font-semibold">Recent Barriers</h2><p className="text-sm text-slate-700">Latest documented barriers</p></div>
          <div className="divide-y">
            {barriers && barriers.length > 0 ? barriers.map((barrier: any) => (
              <div key={barrier.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div><p className="font-medium text-slate-900">{barrier.type || 'Unknown'}</p><p className="text-sm text-slate-700">{barrier.description || 'No description'}</p></div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${barrier.status === 'resolved' ? 'bg-brand-green-100 text-brand-green-800' : barrier.status === 'active' ? 'bg-brand-orange-100 text-brand-orange-800' : 'bg-slate-100 text-slate-900'}`}>{barrier.status || 'pending'}</span>
              </div>
            )) : <div className="p-8 text-center text-slate-700">No barriers documented yet</div>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-4">Learning Barrier Analysis</h2>
        <LearningBarrierAnalyzer />
      </div>
    </div>
  );
}
