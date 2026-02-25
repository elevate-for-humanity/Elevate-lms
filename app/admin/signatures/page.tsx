import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FileSignature, Clock, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/signatures',
  },
  title: 'Signatures Management | Elevate For Humanity',
  description:
    'Manage digital signatures, document approvals, and electronic consent forms.',
};

export default async function SignaturesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Signatures" }]} />
        </div>
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

  // Fetch signatures data
  const { data: signatures, count: totalSignatures } = await db
    .from('signatures')
    .select(
      `
      *,
      signer:profiles(full_name, email)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .limit(50);

  const { count: pendingSignatures } = await db
    .from('signatures')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: completedSignatures } = await db
    .from('signatures')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Signatures" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/heroes/lms-courses.jpg"
          alt="Signatures Management"
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
                <div className="flex items-center gap-3 mb-2">
                  <FileSignature className="h-11 w-11 text-brand-blue-600" />
                  <h3 className="text-sm font-medium text-black">
                    Total Signatures
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {totalSignatures || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-11 w-11 text-brand-orange-600" />
                  <h3 className="text-sm font-medium text-black">Pending</h3>
                </div>
                <p className="text-3xl font-bold text-brand-orange-600">
                  {pendingSignatures || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <h3 className="text-sm font-medium text-black">
                    Completed
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-green-600">
                  {completedSignatures || 0}
                </p>
              </div>
            </div>

            {/* Signatures List */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold mb-4">Recent Signatures</h2>
              {signatures && signatures.length > 0 ? (
                <div className="space-y-4">
                  {signatures.map((signature) => (
                    <div
                      key={signature.id}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">
                            {signature.document_name || 'Untitled Document'}
                          </h3>
                          <p className="text-sm text-black mt-1">
                            Signer:{' '}
                            {signature.signer?.full_name ||
                              signature.signer?.email ||
                              'Unknown'}
                          </p>
                          <p className="text-sm text-black">
                            Requested:{' '}
                            {new Date(
                              signature.created_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {signature.status === 'completed' && (
                            <span className="flex items-center gap-1 text-brand-green-600 text-sm font-medium bg-brand-green-100 px-3 py-2 rounded-full">
                              <span className="text-slate-400 flex-shrink-0">•</span>
                              Completed
                            </span>
                          )}
                          {signature.status === 'pending' && (
                            <span className="flex items-center gap-1 text-brand-orange-600 text-sm font-medium bg-brand-orange-100 px-3 py-2 rounded-full">
                              <Clock className="h-4 w-4" />
                              Pending
                            </span>
                          )}
                          {signature.status === 'declined' && (
                            <span className="flex items-center gap-1 text-brand-orange-600 text-sm font-medium bg-brand-red-100 px-3 py-2 rounded-full">
                              <XCircle className="h-4 w-4" />
                              Declined
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-black text-center py-8">
                  No signatures found
                </p>
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
              Digital Signatures
                        </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Manage e-signature workflows for enrollment and compliance documents.
                        </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/admin/signatures"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                View Signatures
              </Link>
              <Link
                href="/admin/document-center"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                Document Center
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
