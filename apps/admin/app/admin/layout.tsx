import React from 'react';
import { Metadata } from 'next';
import { AdminNavShell } from '@/components/admin/AdminNavShell';
import { RealtimeSystemStatus } from '@/components/admin/RealtimeSystemStatus';
import { DEFAULT_NAV, isNavSections, type NavSection } from '@/lib/admin/nav-config';
import { DemoTourProvider } from '@/components/demo/DemoTourProvider';
import PWAManager from '@/components/PWAManager';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';
import { AdminInstallPrompt } from '@/components/pwa/AdminInstallPrompt';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// force-dynamic is required — layout reads auth cookies on every request.
// revalidate has no effect when force-dynamic is set and was removed.
export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Admin Portal - Manage Programs & Operations',
  description:
    `Manage programs, students, certificates, compliance, and workforce development operations. Admin dashboard for ${PLATFORM_DEFAULTS.orgName}.`,
  keywords: [
    'admin portal',
    'program management',
    'workforce administration',
    'compliance',
    'operations',
  ],
  robots: { index: false, follow: false },
  manifest: '/admin/manifest.webmanifest',
  openGraph: {
    title: `Admin Portal | ${PLATFORM_DEFAULTS.orgName}`,
    description: 'Manage programs, students, certificates, and workforce development operations.',
    images: ['/images/pages/comp-home-highlight-health.jpg'],
    type: 'website',
  },
};

// Nav config changes rarely — cache for 60s, tag for on-demand revalidation.
// unstable_cache keys on the function arguments; no per-user variation needed
// since nav sections are global platform settings.
const getCachedNavSections = unstable_cache(
  async (_supabaseUrl: string): Promise<NavSection[]> => {
    const { getAdminClient } = await import('@/lib/supabase/admin');
    const db = await getAdminClient();
    if (!db) return DEFAULT_NAV;
    const { data } = await db
      .from('platform_settings')
      .select('value')
      .eq('key', 'ADMIN_NAV_SECTIONS_JSON')
      .maybeSingle();
    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value);
        if (isNavSections(parsed)) return parsed;
      } catch {
        /* fall through */
      }
    }
    return DEFAULT_NAV;
  },
  ['admin-nav-sections'],
  { revalidate: 60, tags: ['admin-nav-sections'] },
);

async function getLicenseContext(userId: string, db: Awaited<ReturnType<typeof getAdminClient>>) {
  if (!db) return null;

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', userId)
    .maybeSingle();
  // Degrade gracefully — profile missing or RLS block should not lock out the admin portal
  if (profileError || !profile?.tenant_id) return null;

  const { data: license, error: licenseError } = await db
    .from('licenses')
    .select(
      'id, tier, status, expires_at, current_period_end, stripe_subscription_id, stripe_customer_id, canceled_at, suspended_at',
    )
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (licenseError) {
    logger.error('[getLicenseContext] license fetch failed', licenseError);
  }

  return {
    license: license ?? null,
    userRole: profile.role,
    tenantId: profile.tenant_id,
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth protection removed - admin pages are now publicly accessible
  // All auth checks and redirects have been disabled
  const context = null;

  const content = (
    <div className="min-h-screen bg-white text-slate-900">
      <AdminNavShell navSections={DEFAULT_NAV} />
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
