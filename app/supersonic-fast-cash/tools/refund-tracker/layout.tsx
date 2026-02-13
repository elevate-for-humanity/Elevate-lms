export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Refund Tracker | Supersonic Fast Cash',
  description: 'Track your tax refund status with Supersonic Fast Cash. Login required.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RefundTrackerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  if (!supabase) {
    redirect('/login?next=/supersonic-fast-cash/tools/refund-tracker&reason=secure');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/supersonic-fast-cash/tools/refund-tracker&reason=secure');
  }

  return <>{children}</>;
}
