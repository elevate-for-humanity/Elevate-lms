import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VerificationReviewForm } from '@/components/admin/VerificationReviewForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Review Verification | Admin',
  description: 'Review and approve ID verification',
};

export default async function ReviewVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['admin', 'super_admin']);
  const { id } = await params;
  const supabase = await createClient();



  const { data: rawVerification } = await supabase
    .from('id_verifications')
    .select('*')
    .eq('id', id)
    .single();

  if (!rawVerification) {
    redirect('/admin/verifications/review');
  }

  // Hydrate profile separately (id_verifications.user_id → auth.users, no FK to profiles)
  const { data: verifReviewProfile } = rawVerification.user_id
    ? await supabase.from('profiles').select('id, full_name, email, role').eq('id', rawVerification.user_id).maybeSingle()
    : { data: null };
  const verification = { ...rawVerification, profiles: verifReviewProfile ?? null };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="border-b py-8">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-black mb-2">
            Review ID Verification
          </h1>
          <p className="text-lg text-black">
            Review and approve or reject this identity verification
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <VerificationReviewForm verification={verification} adminId={user.id} />
      </div>
    </div>
  );
}
