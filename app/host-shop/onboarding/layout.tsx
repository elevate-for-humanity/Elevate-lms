import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Server-side auth gate for the generic partner onboarding/application page.
// Replaces the client-side useEffect/getSession check.
// Note: this page is intentionally accessible to unauthenticated users who
// are in the process of creating an account — the apply flow creates the
// account first, then redirects here. Only block if explicitly not logged in
// AND not coming from the apply flow.
export default async function PartnerOnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partner/onboarding');
  }

  return <>{children}</>;
}
