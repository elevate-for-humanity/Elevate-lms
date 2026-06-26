import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import VerificationInbox from '../VerificationInbox';

export const metadata: Metadata = {
  title: 'CE Document Verification | Admin Portal',
  description: 'Verify CE certificates',
};

export const dynamic = 'force-dynamic';

export default async function CEVerifyPage() {
  const supabase = await createClient();
  if (!supabase) {
    redirect('/login');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/portal/admin/verify/ce');
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

  // Get CE docs only
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
    .eq('document_type', 'ce_certificate')
    .eq('status', 'pending')
    .order('uploaded_at', { ascending: true })
    .limit(100);

  const counts = {
    apprentices: 0,
    hostShops: 0,
    transfers: 0,
    ce: pendingDocs?.length || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
            <Breadcrumbs items={[{ label: "Portal", href: "/portal" }, { label: "Admin Verify" }]} />
<div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/portal/admin/verify"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Back to All Documents
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            CE Certificate Verification
          </h1>
          <p className="text-gray-600 mt-1">
            Verify CE certificates to approve continuing education hours
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
