import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import IdentityVerificationFlow from './IdentityVerificationFlow';

export const metadata: Metadata = {
  title: 'Identity Verification | Program Holder',
  description: 'Complete identity verification to activate your account',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/verify-identity',
  },
};

export default async function IdentityVerificationPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Verify Identity" }]} />
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
    redirect('/login?next=/program-holder/verify-identity');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'program_holder') {
    redirect('/unauthorized');
  }

  // Get program holder record
  const { data: programHolder } = await db
    .from('program_holders')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!programHolder) {
    redirect('/program-holder/onboarding/setup');
  }

  // Check if already verified
  if (programHolder.verification_status === 'verified') {
    redirect('/program-holder/dashboard');
  }

  // Get verification status
  const { data: verification } = await db
    .from('program_holder_verification')
    .select('*')
    .eq('program_holder_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get uploaded documents
  const { data: documents } = await db
    .from('program_holder_documents')
    .select('*')
    .eq('program_holder_id', user.id);

  return (
    <IdentityVerificationFlow
      userId={user.id}
      email={user.email || ''}
      programHolder={programHolder}
      verification={verification}
      documents={documents || []}
    />
  );
}
