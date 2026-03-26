import React from 'react';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Onboarding',
  description: 'Complete your onboarding process for Elevate for Humanity.',
};

// Force dynamic rendering for all onboarding pages
export const dynamic = 'force-dynamic';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication and enrollment for onboarding
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/onboarding');
  }

  // Check user role - onboarding is for authenticated users only
  // Different onboarding paths for different roles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // All authenticated users can access onboarding
  // The specific onboarding page will determine what they can do based on role

  return <>{children}</>;
}
