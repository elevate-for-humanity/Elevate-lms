import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/certificates',
  },
  title: 'Certificates | Elevate For Humanity',
  description: 'Manage certificates, credentials, and certifications',
};

export default async function CertificatesPage() {
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
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  const { data: certificates, count: totalCertificates } = await db
    .from('certificates')
    .select(
      `
      *,
      student:profiles(full_name, email),
      program:programs(name)
    `,
      { count: 'exact' }
    )
    .order('issued_at', { ascending: false })
    .limit(50);

  const { count: activeItems } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: issuedCertificates } = await db
    .from('certificates')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'issued');

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch relevant data
  const { data: items, count: totalItems } = await db
    .from('certificates')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Certificates' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/hero/hero-certifications.jpg"
          alt="Certificates"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-black mb-2">
                  Total Items
                </h3>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {totalCertificates || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-black mb-2">
                  Active
                </h3>
                <p className="text-3xl font-bold text-brand-green-600">
                  {activeItems || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-black mb-2">
                  Recent
                </h3>
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

            {/* Data Display */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold mb-4">Items</h2>
              {certificates && certificates.length > 0 ? (
                <div className="space-y-4">
                  {certificates.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <p className="font-semibold">
                        {item.title || item.name || item.id}
                      </p>
                      <p className="text-sm text-black">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-black text-center py-8">No items found</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Issue and Track Certificates
                        </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Generate certificates for program completers and verify credentials.
                        </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/admin/certificates"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                View Certificates
              </Link>
              <Link
                href="/verify-credential"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                Verify Credential
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
