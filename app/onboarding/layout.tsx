import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/auth';

// Force dynamic rendering for all onboarding pages
export const dynamic = 'force-dynamic';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication and enrollment for onboarding
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?redirect=/onboarding');
  }

  // Check user role - onboarding is for authenticated users only
  // Different onboarding paths for different roles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  // All authenticated users can access onboarding
  // The specific onboarding page will determine what they can do based on role

  return <>{children}</>;
}
