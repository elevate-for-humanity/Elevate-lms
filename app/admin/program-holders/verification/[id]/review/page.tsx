import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { redirect } from 'next/navigation';
import VerificationReviewForm from './VerificationReviewForm';

export const dynamic = 'force-dynamic';

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


  // Get program holder
  const { data: holder } = await supabase
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
  const { data: documents } = await supabase
    .from('program_holder_documents')
    .select('*')
    .eq('program_holder_id', holder.user_id)
    .order('uploaded_at', { ascending: false });

  // Get banking
  const { data: banking } = await supabase
    .from('program_holder_banking')
    .select('*')
    .eq('program_holder_id', holder.user_id)
    .maybeSingle();

  // Get verification history
  const { data: verificationHistory } = await supabase
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
