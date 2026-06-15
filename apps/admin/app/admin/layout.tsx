import React from 'react';
import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminNavShell } from '@/components/admin/AdminNavShell';
import { RealtimeSystemStatus } from '@/components/admin/RealtimeSystemStatus';
import { DEFAULT_NAV, isNavSections, type NavSection } from '@/lib/admin/nav-config';
import { DemoTourProvider } from '@/components/demo/DemoTourProvider';
import PWAManager from '@/components/PWAManager';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';
import { AdminInstallPrompt } from '@/components/pwa/AdminInstallPrompt';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Admin Portal - Manage Programs & Operations',
  description: `Manage programs, students, certificates, compliance, and workforce development operations. Admin dashboard for ${PLATFORM_DEFAULTS.orgName}.`,
  keywords: ['admin portal', 'program management', 'workforce administration', 'compliance', 'operations'],
  robots: { index: false, follow: false },
  manifest: '/admin/manifest.webmanifest',
};

const getCachedNavSections = unstable_cache(
  async (_supabaseUrl: string): Promise<NavSection[]> => {
    return DEFAULT_NAV;
  },
  ['admin-nav-sections'],
  { revalidate: 60, tags: ['admin-nav-sections'] },
);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Check authentication
  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/login');
  }

  const navSections = await getCachedNavSections(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').catch(() => DEFAULT_NAV);

  const content = (
    <div className="min-h-screen bg-white text-slate-900">
      <AdminNavShell navSections={navSections} />
      <PWAManager />
      <UpdatePrompt />
      <AdminInstallPrompt />
      <div className="pt-16">
        <RealtimeSystemStatus />
        <main id="main-content" className="flex-1 overflow-x-hidden px-4 sm:px-6 pb-8">
          <div className="w-full max-w-screen-2xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );

  return <DemoTourProvider>{content}</DemoTourProvider>;
}
