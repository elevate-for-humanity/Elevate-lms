import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase/admin';
import { AdminLicenseWrapper } from '@/components/licensing/AdminLicenseWrapper';
import { getLicenseAccessMode } from '@/lib/licensing/billing-authority';
import { reconcileTrialOnboarding } from '@/lib/trial/reconcile-onboarding';
import AdminNav from '@/components/admin/AdminNav';
import { DemoTourProvider } from '@/components/demo/DemoTourProvider';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';


export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Portal - Manage Programs & Operations',
  description:
    'Manage programs, students, certificates, compliance, and workforce development operations. Admin dashboard for Elevate for Humanity.',
  keywords: [
    'admin portal',
    'program management',
    'workforce administration',
    'compliance',
    'operations',
  ],
  manifest: '/manifest-admin.json',
  openGraph: {
    title: 'Admin Portal | Elevate for Humanity',
    description:
      'Manage programs, students, certificates, and workforce development operations.',
    images: ['/images/pages/comp-home-highlight-health.jpg'],
    type: 'website',
  },
};

async function getLicenseContext() {
  const db = await getAdminClient();

  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(`Auth user fetch failed in getLicenseContext: ${userError.message}`);
  if (!user) return null;

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();
  // Degrade gracefully — profile missing or RLS block should not lock out the admin portal
  if (profileError || !profile?.tenant_id) return null;

  const { data: license, error: licenseError } = await db
    .from('licenses')
    .select('id, tier, status, expires_at, current_period_end, stripe_subscription_id, stripe_customer_id, canceled_at, suspended_at')
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (licenseError) {
    // Non-fatal — tenant may have no license row yet; degrade to no-license mode
    logger.error('[getLicenseContext] license fetch failed', licenseError);
  }

  return {
    license: license ?? null,
    userRole: profile.role,
    tenantId: profile.tenant_id,
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check — one call, result reused below
  await requireAdmin();

  // Fetch user + notifications + license context in parallel — single round-trip
  const supabase = await createClient();
  const db = await getAdminClient();

  const [context, headerData] = await Promise.all([
    getLicenseContext(),
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { userName: 'Admin', notifs: [] };

        const [profileRes, appsRes, docsRes] = await Promise.all([
          db.from('profiles').select('full_name, first_name').eq('id', user.id).maybeSingle(),
          db.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'in_review']),
          db.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);
        // Header notification counts are non-critical — log failures but don't throw
        if (appsRes.error) console.error('[AdminLayout] applications count failed:', appsRes.error.message);
        if (docsRes.error) console.error('[AdminLayout] documents count failed:', docsRes.error.message);

        const name = profileRes.data?.first_name || profileRes.data?.full_name?.split(' ')[0] || 'Admin';
        const notifs: import('@/components/admin/AdminNav').AdminNavNotif[] = [];


        if ((appsRes.count ?? 0) > 0) {
          notifs.push({ id: 'apps', unread: true, href: '/admin/applications?status=submitted',
            title: `${appsRes.count} application${appsRes.count !== 1 ? 's' : ''} pending review`,
            time: 'Pending action' });
        }
        if ((docsRes.count ?? 0) > 0) {
          notifs.push({ id: 'docs', unread: true, href: '/admin/documents/review',
            title: `${docsRes.count} document${docsRes.count !== 1 ? 's' : ''} need review`,
            time: 'Compliance required' });
        }

        return { userName: name, notifs };
      } catch {
        return { userName: 'Admin', notifs: [] };
      }
    })(),
  ]);

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
      <AdminNav userName={headerData.userName} notifs={headerData.notifs} />
      <IdleTimeoutGuard />
      <main id="main-content" className="pt-16">
        {children}
      </main>
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
