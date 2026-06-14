import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase/admin';
import { AdminLicenseWrapper } from '@/components/licensing/AdminLicenseWrapper';
import { getLicenseAccessMode } from '@/lib/licensing/billing-authority';
import { reconcileTrialOnboarding } from '@/lib/trial/reconcile-onboarding';
import { withTimeout } from '@/lib/utils/withTimeout';
import { AdminNavShell } from '@/components/admin/AdminNavShell';
import { RealtimeSystemStatus } from '@/components/admin/RealtimeSystemStatus';
import { unstable_cache } from 'next/cache';
import { DEFAULT_NAV, isNavSections, type NavSection } from '@/lib/admin/nav-config';
import { ADMIN_ROLES } from '@/lib/rbac/role-matrix';
import { getSecuritySettings } from '@/lib/admin/security-settings';
import { DemoTourProvider } from '@/components/demo/DemoTourProvider';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/dashboard');
  }

  // Effective DB client — prefer service role for RLS-bypassing reads.
  // AdminNavShell fetches nav config client-side so it never blocks server render.
  const effectiveDb = await getAdminClient();

  // AdminNavShell fetches it client-side via /api/admin/header-data so it
  // never blocks the server render.
  const [roleCheckRes, secondaryRoleRes, context, navSections] = await Promise.all([
    effectiveDb.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    effectiveDb.from('user_roles').select('roles(name)').eq('user_id', user.id),
    withTimeout(getLicenseContext(user.id, effectiveDb), 3000, 'getLicenseContext').catch(
      () => null,
    ),
    // Nav config — served from cache (60s TTL), falls back to DEFAULT_NAV on miss or error
    getCachedNavSections(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').catch(() => DEFAULT_NAV),
  ]);

  // Role enforcement — runs on the result fetched in parallel above.
  // Must match ADMIN_ROLES in lib/rbac/role-matrix.ts and the admin-login route.
  const roleCheck = roleCheckRes.data;
  if (!roleCheck) redirect('/login?error=profile_missing');
  const secondaryRoles = (secondaryRoleRes.data ?? [])
    .map((row) => (row as { roles?: { name?: unknown } | null }).roles?.name)
    .filter((role): role is string => typeof role === 'string');
  const effectiveRoles = Array.from(new Set([roleCheck.role, ...secondaryRoles]));
  if (!effectiveRoles.some((role) => ADMIN_ROLES.includes(role as any))) {
    redirect(`/unauthorized?reason=${encodeURIComponent(String(roleCheck.role ?? 'role_denied'))}`);
  }

  // MFA enforcement — if mfa_required is enabled in platform_settings,
  // redirect admins who haven't set up MFA to the security settings page.
  // Exempt the security settings page itself to avoid a redirect loop.
  const { mfaRequired, sessionTimeoutMs } = await getSecuritySettings();
  if (mfaRequired) {
    const reqHeaders = await headers();
    // x-pathname is set by apps/admin/middleware.ts on every protected request.
    const currentPath = reqHeaders.get('x-pathname') ?? '';
    const isMfaExempt =
      currentPath.startsWith('/admin/settings/security') ||
      currentPath.startsWith('/admin/settings/general');

    if (!isMfaExempt) {
      const { data: mfaRow } = await effectiveDb
        .from('two_factor_auth')
        .select('enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (mfaRow?.enabled !== true) {
        redirect('/admin/settings/security?mfa_required=1');
      }
    }
  }

  // Reconcile trial onboarding — fire and forget
  if (context?.tenantId) {
    reconcileTrialOnboarding(supabase, context.tenantId).catch(() => {});
  }

  // License access enforcement — fail closed
  if (context?.license) {
    const accessResult = getLicenseAccessMode(context.license, context.userRole);

    if (accessResult.mode === 'blocked') {
      redirect(accessResult.redirectTo ?? '/admin/license-required');
    }

    if (accessResult.mode === 'blocked_billing_issue') {
      redirect(accessResult.redirectTo ?? '/admin/billing-issue');
    }
  }

  const content = (
    <div className="min-h-screen bg-white text-slate-900">
      <AdminNavShell navSections={navSections} />
      <IdleTimeoutGuard timeoutMs={sessionTimeoutMs} />
      <PWAManager />
      <UpdatePrompt />
      <AdminInstallPrompt />
      {/* Global operational telemetry bar — visible only when systems need attention */}
      <div className="pt-16">
        <RealtimeSystemStatus />
        <main id="main-content" className="flex-1 overflow-x-hidden px-4 sm:px-6 pb-8">
          <div className="w-full max-w-screen-2xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );

  if (!context) {
    return <DemoTourProvider>{content}</DemoTourProvider>;
  }

  return (
    <DemoTourProvider>
      <AdminLicenseWrapper
        license={context.license}
        userRole={context.userRole}
        tenantId={context.tenantId}
      >
        {content}
      </AdminLicenseWrapper>
    </DemoTourProvider>
  );
}
