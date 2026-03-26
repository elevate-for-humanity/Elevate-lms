import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getRoleDestination } from '@/lib/auth/role-destinations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard',
  alternates: { canonical: 'https://www.elevateforhumanity.org/dashboard' },
};

/**
 * Role-based dashboard router.
 * Destinations are defined in lib/auth/role-destinations.ts — edit there, not here.
 */
export default async function DashboardRouterPage() {
  try {
    const supabase = await createClient();
  
  }
