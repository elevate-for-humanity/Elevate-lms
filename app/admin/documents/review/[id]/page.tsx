import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { DocumentReviewForm } from '@/components/admin/DocumentReviewForm';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Review Document | Admin',
  description: 'Review and approve document',
};

export default async function ReviewDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  if (!user) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    (profile.role !== 'admin' && profile.role !== 'super_admin')
  ) {
    redirect('/unauthorized');
  }

  const { data: document } = await db
    .from('documents')
    .select(
      `
      *,
      profiles:user_id (
        id,
        full_name,
        email,
        role
      )
    `
    )
    .eq('id', id)
    .single();

  if (!document) {
    redirect('/admin/documents/review');
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <section className="bg-white border-b py-8">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-black mb-2">
            Review Document
          </h1>
          <p className="text-lg text-black">
            Review and approve or reject this document
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <DocumentReviewForm document={document} adminId={user.id} />
      </div>
    </div>
  );
}
