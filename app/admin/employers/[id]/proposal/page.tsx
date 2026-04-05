import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Employer Proposal | Elevate For Humanity',
  description: 'View and manage employer partnership proposals.',
};

export default async function EmployerProposalPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: employer } = await supabase.from('employers').select('*').eq('id', params.id).single();

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/employers" className="hover:text-primary">Employers</Link></li><li>/</li><li className="text-gray-900 font-medium">Proposal</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Partnership Proposal</h1>
          <p className="text-gray-600 mt-2">{employer?.name || 'Employer'}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Proposal Details</h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Partnership Type</label><select className="w-full border rounded-lg px-3 py-2"><option>Hiring Partner</option><option>Training Sponsor</option><option>Internship Provider</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Proposed Terms</label><textarea className="w-full border rounded-lg px-3 py-2" rows={4} placeholder="Describe partnership terms..." /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Expected Outcomes</label><textarea className="w-full border rounded-lg px-3 py-2" rows={3} placeholder="Expected hiring commitments, training support, etc." /></div>
            <div className="flex gap-4 pt-4 border-t">
              <button className="flex-1 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Send Proposal</button>
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Save Draft</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
