export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DIYLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  if (!supabase) {
    redirect('/login?next=/supersonic-fast-cash/diy&reason=secure');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/supersonic-fast-cash/diy&reason=secure');
  }

  return <>{children}</>;
}
