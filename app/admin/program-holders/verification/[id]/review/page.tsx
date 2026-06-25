import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { redirect } from 'next/navigation';
import VerificationReviewForm from './VerificationReviewForm';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Review Program Holder | Admin',
  description: 'Review and verify program holder application',
};

export default async function ReviewVerificationPage({ params }: { params: { id: string } }) {
  const { user, profile } = await requireRole(['admin']);
  const supabase = await requireAdminClient();

  // Get program holder
  const { data: rawHolder } = await supabase
    .from('program_holders')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!rawHolder) {
    redirect('/admin/program-holders/verification');
  }

  // Hydrate user profile separately (program_holders.user_id has no FK to profiles)
  const { data: holderUserProfile } = rawHolder.user_id
    ? await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone')
        .eq('id', rawHolder.user_id)
        .maybeSingle()
    : { data: null };
  const holder = { ...rawHolder, user: holderUserProfile ?? null };

  // Get documents — program_holder_documents uses user_id (not program_holder_id)
  const { data: documents } = await supabase
    .from('program_holder_documents')
    .select('*')
    .eq('user_id', holder.user_id)
    .order('created_at', { ascending: false });

  // Get banking — program_holder_banking has no user FK; match by org name
  const { data: banking } = await supabase
    .from('program_holder_banking')
    .select('*')
    .eq('organization_name', holder.organization_name ?? '')
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
    `,
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
