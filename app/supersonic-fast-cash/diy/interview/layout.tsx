export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Tax Interview | Supersonic Fast Cash',
  description: 'Complete your tax interview. Login required to protect your information.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DIYInterviewLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  if (!supabase) {
    redirect('/login?next=/supersonic-fast-cash/diy/interview&reason=secure');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/supersonic-fast-cash/diy/interview&reason=secure');
  }

  return <>{children}</>;
}
