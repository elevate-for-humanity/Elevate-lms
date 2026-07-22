import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function LMSRootPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // If logged in, redirect to enrollment
    redirect('/enrollment');
  }
  
  // If not logged in, redirect to login
  redirect('/login');
}
