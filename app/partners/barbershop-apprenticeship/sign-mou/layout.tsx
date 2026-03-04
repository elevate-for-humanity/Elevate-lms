export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign MOU | Elevate for Humanity',
  description: 'Sign the Memorandum of Understanding for the barbershop apprenticeship.',
};

export default async function SignMOULayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?redirect=/partners/barbershop-apprenticeship/sign-mou');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partners/barbershop-apprenticeship/sign-mou');
  }

  return <>{children}</>;
}
