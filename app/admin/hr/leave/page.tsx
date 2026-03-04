import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/hr/leave' },
  title: 'Leave Management | Elevate For Humanity',
  description: 'Manage employee leave requests and balances.',
};

export default async function LeavePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: requests } = await db.from('leave_requests').select('*, profiles!inner(full_name)').eq('status', 'pending').order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-hr-leave-hero.jpg" alt="HR administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/hr" className="hover:text-primary">HR</Link></li><li>/</li><li className="text-gray-900 font-medium">Leave</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-2">Review and approve leave requests</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Pending Requests</h3><p className="text-3xl font-bold text-yellow-600 mt-2">{requests?.length || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Approved This Month</h3><p className="text-3xl font-bold text-brand-green-600 mt-2">12</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">On Leave Today</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">3</p></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b"><h2 className="font-semibold">Pending Requests</h2></div>
          <div className="divide-y">
            {requests && requests.length > 0 ? requests.map((req: any) => (
              <div key={req.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div><p className="font-medium">{req.profiles?.full_name}</p><p className="text-sm text-gray-500">{req.leave_type} • {req.start_date} to {req.end_date}</p></div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-brand-green-600 text-white rounded text-sm hover:bg-brand-green-700">Approve</button>
                  <button className="px-3 py-1 bg-brand-red-600 text-white rounded text-sm hover:bg-brand-red-700">Deny</button>
                </div>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No pending requests</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
