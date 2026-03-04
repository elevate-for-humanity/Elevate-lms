export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Policy Acknowledgment | Elevate for Humanity',
  description: 'Review and acknowledge barbershop apprenticeship policies.',
};

export default async function PolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?redirect=/partners/barbershop-apprenticeship/policy-acknowledgment');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partners/barbershop-apprenticeship/policy-acknowledgment');
  }

  return <>{children}</>;
}
