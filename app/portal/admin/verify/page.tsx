import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import VerificationInbox from './VerificationInbox';

export const metadata: Metadata = {
  title: 'Document Verification | Admin Portal',
  description: 'Verify documents for apprentices, host shops, and transfers',
};

export const dynamic = 'force-dynamic';

export default async function AdminVerifyPage() {
  const supabase = await createClient();
  if (!supabase) {
    redirect('/login');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/portal/admin/verify');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin'].includes(profile.role)) {
    redirect('/');
  }

  // Get counts for summary chips
  const [apprenticePending, shopPending, transferPending, cePending] = await Promise.all([
    // Apprentices with unverified photo_id
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('document_type', 'photo_id')
      .eq('status', 'pending'),
    // Host shops with unverified licenses
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .in('document_type', ['shop_license', 'barber_license'])
      .eq('status', 'pending'),
    // Transfer docs pending
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .in('document_type', ['school_transcript', 'certificate', 'out_of_state_license'])
      .eq('status', 'pending'),
    // CE certs pending
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('document_type', 'ce_certificate')
      .eq('status', 'pending'),
  ]);

  // Get all pending documents with owner info
  const { data: pendingDocs } = await supabase
    .from('documents')
    .select(`
      id,
      document_type,
      file_name,
      file_url,
      status,
      uploaded_at,
      user_id,
      owner_type,
      owner_id,
      rejection_reason,
      profiles:user_id (
        id,
        full_name,
        email
      )
    `)
    .eq('status', 'pending')
    .order('uploaded_at', { ascending: true })
    .limit(100);

  const counts = {
    apprentices: apprenticePending.count || 0,
    hostShops: shopPending.count || 0,
    transfers: transferPending.count || 0,
    ce: cePending.count || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
            <Breadcrumbs items={[{ label: "Portal", href: "/portal" }, { label: "Admin Verify" }]} />
<div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
          <p className="text-gray-600 mt-1">
            Review and verify documents to unblock enrollments and transfers
          </p>
        </div>

        <VerificationInbox
          documents={pendingDocs || []}
          counts={counts}
          adminId={user.id}
        />
      </div>
    </div>
  );
}
