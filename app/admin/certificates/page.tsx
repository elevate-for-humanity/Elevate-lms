import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
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
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  const { data: certificates, count: totalCertificates } = await supabase
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

  const { count: activeItems } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: issuedCertificates } = await supabase
    .from('certificates')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'issued');

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch relevant data
  const { data: items, count: totalItems } = await supabase
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
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes/accessibility.jpg"
          alt="Certificates"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Certificates</h1>
          <p className="text-base md:text-lg mb-8 text-gray-100">
            Manage certificate templates and issuance.
            and development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin/dashboard"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
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
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Explore training programs and earn industry certifications through Elevate for
              programs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
