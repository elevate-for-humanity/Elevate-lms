import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import IdentityVerificationFlow from './IdentityVerificationFlow';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Identity Verification | Program Holder',
  description: 'Complete identity verification to activate your account',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/verify-identity',
  },
};

export default async function IdentityVerificationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/program-holder/verify-identity');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'program_holder') {
    redirect('/unauthorized');
  }

  // Get program holder record
  const { data: programHolder } = await supabase
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
  const { data: verification } = await supabase
    .from('program_holder_verification')
    .select('*')
    .eq('program_holder_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get uploaded documents
  const { data: documents } = await supabase
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
