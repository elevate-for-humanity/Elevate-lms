import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { Building2, Clock, CheckCircle, XCircle, Eye, Send } from 'lucide-react';
import ResendOnboardingButton from './ResendOnboardingButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Holders | Admin | Elevate For Humanity',
  description: 'Manage program holder organizations and approvals.',
  robots: { index: false, follow: false },
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-brand-green-100 text-brand-green-800',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-brand-red-100 text-brand-red-800',
  suspended: 'bg-gray-100 text-gray-600',
};

export default async function AdminProgramHoldersPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const supabase = await getAdminClient();

  // Fetch all program holders
  const { data: holders } = await supabase
    .from('program_holders')
    .select('id, organization_name, name, contact_name, contact_email, contact_phone, status, mou_signed, created_at, user_id')
    .order('created_at', { ascending: false });

  // Fetch program counts per holder
  const holderIds = (holders || []).map((h: any) => h.id);
  const { data: programCounts } = holderIds.length > 0
    ? await supabase
        .from('program_holder_programs')
        .select('program_holder_id')
        .in('program_holder_id', holderIds)
    : { data: [] };

  const countMap: Record<string, number> = {};
  (programCounts || []).forEach((pc: any) => {
    countMap[pc.program_holder_id] = (countMap[pc.program_holder_id] || 0) + 1;
  });

  const items = holders || [];
  const pending = items.filter((h: any) => h.status === 'pending').length;
  const active = items.filter((h: any) => h.status === 'active').length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Program Holders' },
          ]} />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Program Holders</h1>
            <p className="text-gray-600 mt-1">Manage program holder organizations and approvals</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-500">Total</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{items.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-medium text-gray-500">Pending Approval</h3>
            </div>
            <p className="text-3xl font-bold text-amber-600">{pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-brand-green-500" />
              <h3 className="text-sm font-medium text-gray-500">Active</h3>
            </div>
            <p className="text-3xl font-bold text-brand-green-600">{active}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b bg-gray-50">
                    <th className="px-4 py-3 font-medium">Organization</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium text-center">Programs</th>
                    <th className="px-4 py-3 font-medium text-center">MOU</th>
                    <th className="px-4 py-3 font-medium text-center">Status</th>
                    <th className="px-4 py-3 font-medium">Applied</th>
                    <th className="px-4 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((h: any) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{h.organization_name || h.name || 'Unnamed'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{h.contact_name || '—'}</p>
                        <p className="text-xs text-gray-500">{h.contact_email || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${(countMap[h.id] || 0) === 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                          {countMap[h.id] || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {h.mou_signed ? (
                          <CheckCircle className="w-4 h-4 text-brand-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${STATUS_STYLES[h.status] || 'bg-gray-100 text-gray-600'}`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(h.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            href={`/admin/program-holders/${h.id}`}
                            className="inline-flex items-center gap-1 text-brand-blue-600 hover:underline text-sm font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </Link>
                          <ResendOnboardingButton holderId={h.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No program holders yet</p>
              <p className="text-sm text-gray-500 mt-1">Program holder applications will appear here when submitted.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
