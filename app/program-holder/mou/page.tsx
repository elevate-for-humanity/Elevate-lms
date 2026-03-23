import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/program-holder/mou' },
  title: 'Program Holder MOU | Elevate For Humanity',
  description: 'View and manage your memorandum of understanding.',
};

export default async function ProgramHolderMOUPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mou } = await db.from('mous').select('*').eq('user_id', user.id).single();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/program-holder" className="hover:text-primary">Program Holder</Link></li><li>/</li><li className="text-gray-900 font-medium">MOU</li></ol></nav>
          <InstitutionalHeader
            documentType="Memorandum of Understanding"
            title="Partnership Agreement"
            subtitle="Your partnership agreement details"
            noDivider
          />
        </div>
        {mou ? (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Agreement Status</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${mou.status === 'active' ? 'bg-brand-green-100 text-brand-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{mou.status || 'Pending'}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><p className="text-sm text-gray-500">Effective Date</p><p className="font-medium">{mou.effective_date ? new Date(mou.effective_date).toLocaleDateString() : 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500">Expiration Date</p><p className="font-medium">{mou.expiry_date ? new Date(mou.expiry_date).toLocaleDateString() : 'N/A'}</p></div>
            </div>
            <div className="flex gap-4">
              <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Download MOU</button>
              <button className="border px-4 py-2 rounded-lg hover:bg-white">Request Amendment</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <p className="text-gray-500 mb-4">No MOU on file</p>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Request MOU</button>
          </div>
        )}
      </div>
    </div>
  );
}
