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
    images: ['/images/efh/hero/hero-main-clean.jpg'],
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
  // Auth check - bypassed in demo/development mode via lib/auth.ts
  // Login page lives at /admin-login (outside this layout) to avoid auth loop.
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/admin-login?redirect=/admin');
  }

  // Get license context for banner
  const context = await getLicenseContext();

  // Reconcile trial onboarding state if the fire-and-forget call missed
  if (context?.tenantId) {
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (supabase) {
      reconcileTrialOnboarding(supabase, context.tenantId).catch(() => {});
    }
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
    <>
      <IdleTimeoutGuard />
      <AdminSidebar />
      <div className="lg:pl-60">
        <AdminHeader />
        <main id="main-content" className="pt-16 min-h-screen bg-gray-50">{children}</main>
      </div>
    </>
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
