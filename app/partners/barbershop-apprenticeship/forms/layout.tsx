export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Barbershop Apprenticeship Forms | Elevate for Humanity',
  description: 'Required forms for the barbershop apprenticeship program.',
};

export default async function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?redirect=/partners/barbershop-apprenticeship/forms');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partners/barbershop-apprenticeship/forms');
  }

  return <>{children}</>;
}
