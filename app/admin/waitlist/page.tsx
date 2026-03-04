import Image from 'next/image';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Waitlist | Admin | Elevate For Humanity',
  description: 'View and manage program waitlist entries',
};

const statusColors: Record<string, string> = {
  waiting: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-brand-blue-100 text-brand-blue-800',
  enrolled: 'bg-brand-green-100 text-brand-green-800',
  removed: 'bg-gray-100 text-gray-600',
};

export default async function AdminWaitlistPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) {
    return <div className="p-8 text-center">Service unavailable</div>;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  const { data: entries, error } = await db
    .from('waitlist')
    .select('*')
    .order('created_at', { ascending: false });

  // Count by status
  const counts: Record<string, number> = {};
  entries?.forEach((e: { status: string }) => {
    counts[e.status] = (counts[e.status] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-waitlist-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Waitlist' }]} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Program Waitlist</h1>
            <p className="text-gray-600 mt-1">{entries?.length || 0} total entries</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Waiting</h3>
            <p className="text-2xl font-bold text-yellow-600">{counts['waiting'] || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Contacted</h3>
            <p className="text-2xl font-bold text-brand-blue-600">{counts['contacted'] || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Enrolled</h3>
            <p className="text-2xl font-bold text-brand-green-600">{counts['enrolled'] || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Removed</h3>
            <p className="text-2xl font-bold text-gray-500">{counts['removed'] || 0}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {error ? (
            <div className="p-8 text-center text-brand-red-600">
              Error loading waitlist. Ensure the waitlist table exists.
            </div>
          ) : entries && entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {entry.first_name} {entry.last_name}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{entry.email}</div>
                        {entry.phone && <div className="text-sm text-gray-500">{entry.phone}</div>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {(entry.program_slug || '').replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[entry.status] || 'bg-gray-100 text-gray-800'}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString('en-US')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No waitlist entries yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
