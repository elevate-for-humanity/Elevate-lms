import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { redirect } from 'next/navigation';
import VerificationReviewForm from './VerificationReviewForm';

export const metadata: Metadata = {
  title: 'Review Program Holder | Admin',
  description: 'Review and verify program holder application',
};

export default async function ReviewVerificationPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, profile } = await requireRole(['admin', 'super_admin']);
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

  // Get program holder
  const { data: holder } = await db
    .from('program_holders')
    .select(
      `
      *,
      user:profiles!user_id(
        id,
        email,
        first_name,
        last_name,
        phone
      )
    `
    )
    .eq('id', params.id)
    .single();

  if (!holder) {
    redirect('/admin/program-holders/verification');
  }

  // Get documents
  const { data: documents } = await db
    .from('program_holder_documents')
    .select('*')
    .eq('program_holder_id', holder.user_id)
    .order('uploaded_at', { ascending: false });

  // Get banking
  const { data: banking } = await db
    .from('program_holder_banking')
    .select('*')
    .eq('program_holder_id', holder.user_id)
    .single();

  // Get verification history
  const { data: verificationHistory } = await db
    .from('program_holder_verification')
    .select(
      `
      *,
      verified_by_user:profiles!verified_by(
        first_name,
        last_name
      )
    `
    )
    .eq('program_holder_id', holder.user_id)
    .order('created_at', { ascending: false });

  return (
    <>
      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-ph-verify-review-hero.jpg" alt="Verification review" fill sizes="100vw" className="object-cover" priority />
      </section>
      <VerificationReviewForm
        holder={holder}
        documents={documents || []}
        banking={banking}
        verificationHistory={verificationHistory || []}
        adminUserId={user.id}
      />
    </>
  );
}
