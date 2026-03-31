import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminLicenseWrapper } from '@/components/licensing/AdminLicenseWrapper';
import { getLicenseAccessMode } from '@/lib/licensing/billing-authority';
import { reconcileTrialOnboarding } from '@/lib/trial/reconcile-onboarding';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
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
  try {
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get user profile with role and tenant
    const { data: profile } = await db
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) return null;

    // Get license for tenant
    const { data: license } = await db
      .from('licenses')
      .select('id, tier, status, expires_at, current_period_end, stripe_subscription_id, stripe_customer_id, canceled_at, suspended_at')
      .eq('tenant_id', profile.tenant_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      license,
      userRole: profile.role,
      tenantId: profile.tenant_id,
    };
  } catch {
    return null;
  }
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
  const db = createAdminClient();

  const [context, headerData] = await Promise.all([
    getLicenseContext(),
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { userName: 'Admin', userInitial: 'A', notifs: [] };

        const [profileRes, appsRes, docsRes] = await Promise.all([
          db.from('profiles').select('full_name, first_name').eq('id', user.id).maybeSingle(),
          db.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending', 'in_review']),
          db.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);

        const name = profileRes.data?.first_name || profileRes.data?.full_name?.split(' ')[0] || 'Admin';
        const notifs: import('@/components/admin/AdminHeader').AdminHeaderNotif[] = [];

        if ((appsRes.count ?? 0) > 0) {
          notifs.push({ id: 'apps', unread: true, href: '/admin/applications?status=pending',
            title: `${appsRes.count} application${appsRes.count !== 1 ? 's' : ''} pending review`,
            time: 'Pending action' });
        }
        if ((docsRes.count ?? 0) > 0) {
          notifs.push({ id: 'docs', unread: true, href: '/admin/documents/review',
            title: `${docsRes.count} document${docsRes.count !== 1 ? 's' : ''} need review`,
            time: 'Compliance required' });
        }

        return { userName: name, userInitial: name[0].toUpperCase(), notifs };
      } catch {
        return { userName: 'Admin', userInitial: 'A', notifs: [] };
      }
    })(),
  ]);

  // Reconcile trial onboarding — fire and forget
  if (context?.tenantId) {
    reconcileTrialOnboarding(supabase, context.tenantId).catch(() => {});
  }

  // Check if user should be blocked (non-admin with expired license)
  if (context?.license) {
    const accessResult = getLicenseAccessMode(context.license, context.userRole);
    
    if (accessResult.mode === 'blocked' && accessResult.redirectTo) {
      redirect(accessResult.redirectTo);
    }
    
    if (accessResult.mode === 'blocked_billing_issue' && accessResult.redirectTo) {
      redirect(accessResult.redirectTo);
    }
  }

  const content = (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <IdleTimeoutGuard />
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader userName={headerData.userName} userInitial={headerData.userInitial} notifs={headerData.notifs} />
        {/* pt-20 matches fixed header h-20 */}
        <main id="main-content" className="min-h-screen px-4 pb-6 pt-20 sm:px-6 lg:px-8">
          {children}
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
