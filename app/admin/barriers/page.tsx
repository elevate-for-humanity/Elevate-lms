import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/barriers',
  },
  title: 'Barriers Management | Elevate For Humanity',
  description: 'Track and manage participant barriers to employment and training.',
};

export default async function BarriersPage() {
  const supabase = await createClient();

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch barriers data
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Barriers</li>
            </ol>
          </nav>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Barriers Management</h1>
              <p className="text-gray-600 mt-2">Track and resolve participant barriers to success</p>
            </div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">
              Add Barrier
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Total Barriers</h3>
              <span className="text-brand-blue-600 bg-brand-blue-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalBarriers || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Documented barriers</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Active</h3>
              <span className="text-orange-600 bg-orange-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{activeBarriers || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Needs attention</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Resolved</h3>
              <span className="text-green-600 bg-green-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{resolvedBarriers || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Successfully addressed</p>
          </div>
        </div>

        {/* Barrier Types */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Barrier Categories</h2>
            <p className="text-sm text-gray-500">Common barriers tracked in the system</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6">
            {barrierTypes.map((type) => (
              <div key={type.name} className="p-4 border rounded-lg hover:bg-gray-50">
                <span className="text-2xl">{type.icon}</span>
                <h3 className="font-medium mt-2">{type.name}</h3>
                <p className="text-sm text-gray-500">{type.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Barriers */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Recent Barriers</h2>
            <p className="text-sm text-gray-500">Latest documented barriers</p>
          </div>
          <div className="divide-y">
            {barriers && barriers.length > 0 ? (
              barriers.map((barrier: any) => (
                <div key={barrier.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{barrier.type || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{barrier.description || 'No description'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    barrier.status === 'resolved' 
                      ? 'bg-green-100 text-green-800' 
                      : barrier.status === 'active'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {barrier.status || 'pending'}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No barriers documented yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
