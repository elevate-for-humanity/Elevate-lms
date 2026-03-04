import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/certifications/bulk',
  },
  title: 'Bulk Certification Management | Elevate For Humanity',
  description: 'Manage certifications for multiple participants at once.',
};

export default async function BulkCertificationsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch certification types
  const { data: certificationTypes } = await db
    .from('certification_types')
    .select('id, name, provider, validity_months')
    .order('name');

  // Fetch pending certifications
  const { data: pendingCertifications, count: pendingCount } = await db
    .from('user_certifications')
    .select(`
      id,
      user_id,
      certification_type_id,
      status,
      earned_date,
      profiles!inner(full_name, email)
    `, { count: 'exact' })
    .eq('status', 'pending')
    .limit(20);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-certifications-bulk-hero.jpg" alt="Bulk certifications" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/certifications" className="hover:text-primary">Certifications</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Bulk Management</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Certification Management</h1>
          <p className="text-gray-600 mt-2">Approve, update, or manage certifications in bulk</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <select className="border rounded-lg px-3 py-2 text-sm">
                <option value="">Filter by Type</option>
                {certificationTypes?.map((type: any) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <select className="border rounded-lg px-3 py-2 text-sm">
                <option value="">Filter by Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="bg-brand-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-green-700">
                Approve Selected
              </button>
              <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-blue-700">
                Export CSV
              </button>
              <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                Import CSV
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-900">{pendingCount || 0}</p>
          </div>
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4">
            <p className="text-sm text-brand-green-800">Approved Today</p>
            <p className="text-2xl font-bold text-brand-green-900">0</p>
          </div>
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4">
            <p className="text-sm text-brand-red-800">Expiring Soon</p>
            <p className="text-2xl font-bold text-brand-red-900">0</p>
          </div>
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
            <p className="text-sm text-brand-blue-800">Total Active</p>
            <p className="text-2xl font-bold text-brand-blue-900">0</p>
          </div>
        </div>

        {/* Certifications Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Pending Certifications</h2>
              <p className="text-sm text-gray-500">Review and approve certification records</p>
            </div>
            <div className="flex gap-2">
              <button className="text-sm text-brand-blue-600 hover:text-brand-blue-800">Select All</button>
              <span className="text-gray-300">|</span>
              <button className="text-sm text-gray-600 hover:text-gray-800">Clear</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <input type="checkbox" className="w-4 h-4 rounded" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certification</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earned Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingCertifications && pendingCertifications.length > 0 ? (
                  pendingCertifications.map((cert: any) => (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input type="checkbox" className="w-4 h-4 rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{cert.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{cert.profiles?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{cert.certification_type_id}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {cert.earned_date ? new Date(cert.earned_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          {cert.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-brand-green-600 hover:text-brand-green-800 text-sm">Approve</button>
                          <button className="text-brand-red-600 hover:text-brand-red-800 text-sm">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No pending certifications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
