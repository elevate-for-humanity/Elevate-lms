import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Building2, Users, CheckCircle, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/reports/partners' },
  title: 'Partner Reports | Elevate For Humanity',
  description: 'View partner performance and collaboration metrics.',
  robots: { index: false, follow: false },
};

export default async function PartnerReportsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) redirect('/unauthorized');

  // Fetch real stats from DB
  const [
    { count: activePartners },
    { count: totalEnrollments },
    { count: completedEnrollments },
    { data: partnerList },
    { data: recentInquiries },
  ] = await Promise.all([
    db.from('partners').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('partner_enrollments').select('*', { count: 'exact', head: true }),
    db.from('partner_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    db.from('partners').select('id, name, city, state, status, created_at').order('created_at', { ascending: false }).limit(20),
    db.from('partner_inquiries').select('id, name, organization, status, created_at').order('created_at', { ascending: false }).limit(10),
  ]);

  const total = totalEnrollments || 0;
  const completed = completedEnrollments || 0;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stats = [
    { label: 'Active Partners', value: activePartners || 0, icon: Building2, color: 'text-gray-900' },
    { label: 'Total Enrollments', value: total, icon: Users, color: 'text-brand-blue-600' },
    { label: 'Completions', value: completed, icon: CheckCircle, color: 'text-brand-green-600' },
    { label: 'Completion Rate', value: `${successRate}%`, icon: TrendingUp, color: 'text-brand-blue-600' },
  ];

  const partners = partnerList || [];
  const inquiries = recentInquiries || [];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/how-it-works-hero.jpg" alt="Reports and analytics" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Reports', href: '/admin/reports' },
            { label: 'Partners' },
          ]} />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Partner Reports</h1>
          <p className="text-gray-600 mt-2">Partner performance and enrollment metrics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-5 h-5 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
              </div>
              <p className={`text-3xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Partner List */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Partners</h2>
              <Link href="/admin/partners" className="text-sm text-brand-blue-600 hover:underline">View all</Link>
            </div>
            {partners.length > 0 ? (
              <div className="space-y-3">
                {partners.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{p.name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-500">{p.city || '—'}, {p.state || 'IN'}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      p.status === 'active' ? 'bg-brand-green-100 text-brand-green-800' :
                      p.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {p.status || 'unknown'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-4 text-center">No partners found.</p>
            )}
          </div>

          {/* Recent Inquiries */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Inquiries</h2>
              <Link href="/admin/partner-inquiries" className="text-sm text-brand-blue-600 hover:underline">View all</Link>
            </div>
            {inquiries.length > 0 ? (
              <div className="space-y-3">
                {inquiries.map((inq: any) => (
                  <div key={inq.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{inq.name}</p>
                      <p className="text-xs text-gray-500">{inq.organization || '—'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        inq.status === 'approved' ? 'bg-brand-green-100 text-brand-green-800' :
                        inq.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        inq.status === 'reviewing' ? 'bg-brand-blue-100 text-brand-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {inq.status}
                      </span>
                      {inq.created_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(inq.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-4 text-center">No inquiries yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
