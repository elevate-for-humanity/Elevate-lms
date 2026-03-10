import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// /student-portal/dashboard is linked from the portals page.
// Students land on /lms/dashboard after login — redirect there.
export default async function StudentPortalDashboardRedirect() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?redirect=/lms/dashboard');
  }

  redirect('/lms/dashboard');
}
