import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://admin.elevateforhumanity.org/partners',
  },
  title: 'Admin Partners | Elevate For Humanity',
  description: 'Manage training provider partnerships',
};

export default async function PartnersPage() {
  await requireRole(['super_admin', 'admin']);
  const supabase = await requireAdminClient();

  const { count: activePartners } = await supabase
    .from('partners')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: pendingApplications } = await supabase
    .from('partner_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { data: items, count: totalItems } = await supabase
    .from('partners')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Partners' }]} />
      </div>
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/admin-partners-detail.jpg"
          alt="Partners"
          fill
          className="object-cover"
          quality={90}
          priority
          sizes="100vw"
        />
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-black mb-2">Total Partners</h3>
                <p className="text-3xl font-bold text-brand-blue-600">{totalItems || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-black mb-2">Active</h3>
                <p className="text-3xl font-bold text-brand-green-600">{activePartners || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-black mb-2">Pending Applications</h3>
                <p className="text-3xl font-bold text-amber-600">{pendingApplications || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-black mb-2">Recent</h3>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {items?.filter((i) => {
                    const created = new Date(i.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return created > weekAgo;
                  }).length || 0}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold mb-4">Partners</h2>
              {items && items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item: any) => (
                    <div key={item.id} className="p-4 border rounded-lg hover:bg-slate-50">
                      <p className="font-semibold">{item.title || item.name || item.id}</p>
                      <p className="text-sm text-black">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-black text-center py-8">No partner records found</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Partner Management</h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Manage training partners, MOUs, and referral agreements.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/partners/applications"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-slate-50 text-lg"
              >
                Review Applications
              </Link>
              <Link
                href="/partners"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                View Partners
              </Link>
              <Link
                href="/program-holders"
                className="bg-brand-blue-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-700 border-2 border-white text-lg"
              >
                View Program Holders
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
