import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { User, ArrowLeft, Search } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Job Ready Indy Participants | Elevate For Humanity',
};

export default async function JRIParticipantsPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();



  const { data: participants } = await supabase
    .from('jri_participants')
    .select('id, status, program, enrolled_at, employment_status, profiles(full_name, email, phone)')
    .order('enrolled_at', { ascending: false })
    .limit(100);

  const statusBadge: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-brand-blue-100 text-brand-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    withdrawn: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Job Ready Indy', href: '/admin/jri' }, { label: 'Participants' }]} />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Ready Indy Participants</h1>
              <p className="text-gray-600 mt-1">{participants?.length || 0} total participants</p>
            </div>
            <Link href="/admin/jri/participants/new" className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 text-sm font-medium">
              Add Participant
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Participant</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Program</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employment</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {participants && participants.length > 0 ? participants.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-brand-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p.profiles?.full_name || 'Participant'}</p>
                        <p className="text-xs text-gray-500">{p.profiles?.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.program || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusBadge[p.status] || 'bg-gray-100 text-gray-600'}`}>
                      {p.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${p.employment_status === 'employed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.employment_status || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.enrolled_at ? new Date(p.enrolled_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No participants yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
