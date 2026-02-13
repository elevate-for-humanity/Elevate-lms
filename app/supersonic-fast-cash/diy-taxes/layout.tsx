export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'DIY Tax Filing | Supersonic Fast Cash | Elevate for Humanity',
  description: 'File your taxes yourself with our secure DIY tax preparation tool. Login required to protect your sensitive information.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/diy-taxes',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DIYTaxesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  if (!supabase) {
    redirect('/login?next=/supersonic-fast-cash/diy-taxes&reason=secure');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/supersonic-fast-cash/diy-taxes&reason=secure');
  }

  return <>{children}</>;
}
