import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Building2, Mail, ExternalLink, ArrowLeft, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Course Partners | Admin',
  description: 'Manage course provider partnerships.',
  robots: { index: false, follow: false },
};

export default async function CoursePartnersPage() {
  const supabase = await createClient();
  if (!supabase) {
    return <div className="p-8 text-center text-gray-600">Database unavailable.</div>;
  }

  const { data: partners, count } = await supabase
    .from('profiles')
    .select('id, full_name, email, organization_id, created_at, is_active', { count: 'exact' })
    .eq('role', 'partner')
    .order('created_at', { ascending: false });

  const partnerList = partners ?? [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Courses', href: '/admin/courses' },
            { label: 'Partners' },
          ]} />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/courses" className="text-sm text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Courses
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Course Partners</h1>
            <p className="text-sm text-gray-500 mt-1">{count ?? 0} partner organizations</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {partnerList.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No course partners found.</p>
              <p className="text-xs text-gray-400 mt-1">Partners will appear here when profiles with the partner role are created.</p>
              <Link href="/admin/partners" className="inline-block mt-4 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                Go to Partner Management
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partnerList.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-teal-700">{(p.full_name || 'P')[0].toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{p.full_name || 'Unnamed Partner'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{p.email || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active ? 'bg-brand-green-100 text-brand-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
