import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/certificates/bulk',
  },
  title: 'Bulk Certificate Issuance | Elevate For Humanity',
  description: 'Issue certificates to multiple participants at once.',
};

export default async function BulkCertificatesPage() {
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

  // Fetch certificate templates
  const { data: templates } = await db
    .from('certificate_templates')
    .select('id, name, description')
    .eq('status', 'active')
    .order('name');

  // Fetch eligible participants (completed courses without certificates)
  const { data: eligibleParticipants, count: eligibleCount } = await db
    .from('enrollments')
    .select(`
      id,
      user_id,
      course_id,
      completed_at,
      profiles!inner(full_name, email),
      courses!inner(title)
    `, { count: 'exact' })
    .eq('status', 'completed')
    .is('certificate_issued', null)
    .limit(20);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/certificates" className="hover:text-primary">Certificates</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Bulk Issue</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Certificate Issuance</h1>
          <p className="text-gray-600 mt-2">Issue certificates to multiple participants at once</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Template
                  </label>
                  <select className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500">
                    <option value="">Select a template</option>
                    {templates?.map((template: any) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Date
                  </label>
                  <input 
                    type="date" 
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signed By
                  </label>
                  <input 
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="Director Name"
                  />
                </div>

                <button className="w-full bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 mt-4">
                  Issue Selected Certificates
                </button>
              </div>
            </div>

            <div className="bg-brand-blue-50 rounded-lg p-4 mt-4">
              <h3 className="font-medium text-brand-blue-900">Eligible Participants</h3>
              <p className="text-3xl font-bold text-brand-blue-600 mt-1">{eligibleCount || 0}</p>
              <p className="text-sm text-brand-blue-700">Ready for certificate issuance</p>
            </div>
          </div>

          {/* Right Column - Participants List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">Eligible Participants</h2>
                  <p className="text-sm text-gray-500">Select participants to issue certificates</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-sm text-brand-blue-600 hover:text-brand-blue-800">Select All</button>
                  <span className="text-gray-300">|</span>
                  <button className="text-sm text-gray-600 hover:text-gray-800">Clear</button>
                </div>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {eligibleParticipants && eligibleParticipants.length > 0 ? (
                  eligibleParticipants.map((enrollment: any) => (
                    <div key={enrollment.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                      <input type="checkbox" className="w-4 h-4 text-brand-blue-600 rounded" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {enrollment.profiles?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">{enrollment.profiles?.email}</p>
                        <p className="text-sm text-brand-blue-600">{enrollment.courses?.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Completed</p>
                        <p className="text-sm font-medium">
                          {enrollment.completed_at 
                            ? new Date(enrollment.completed_at).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No eligible participants found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
