import { Metadata } from 'next';
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
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
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

  const { data: verification } = await supabase
    .from('id_verifications')
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

  if (!verification) {
    redirect('/admin/verifications/review');
  }

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
