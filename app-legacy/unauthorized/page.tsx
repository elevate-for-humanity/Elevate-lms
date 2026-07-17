'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getRoleDestination } from '@/lib/auth/role-destinations';

const WWW_ORIGIN =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
const ADMIN_ORIGIN =
  process.env.NEXT_PUBLIC_ADMIN_URL || '';
const ADMIN_PORTAL_ROLES = new Set(['admin', 'super_admin', 'staff', 'org_admin', 'platform_operator']);

export default function UnauthorizedPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    sb.auth.getUser().then(async ({ data }) => {
      setEmail(data.user?.email ?? null);
      if (!data.user) return;
      const { data: profile } = await sb
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();
      const { data: roleRows } = await sb
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', data.user.id);
      const secondaryRoles = (roleRows ?? [])
        .map((row) => (row as { roles?: { name?: unknown } | null }).roles?.name)
        .filter((value): value is string => typeof value === 'string');
      const effectiveRoles = [profile?.role, ...secondaryRoles].filter(
        (value): value is string => typeof value === 'string',
      );
      setRole(effectiveRoles.find((value) => ADMIN_PORTAL_ROLES.has(value)) ?? profile?.role ?? null);
    });
  }, []);

  const isAdminPortalRole = ADMIN_PORTAL_ROLES.has(role ?? '');
  const adminDashboardHref = `${ADMIN_ORIGIN.replace(/\/$/, '')}/admin/dashboard`;
  const portalPath = role ? getRoleDestination(role) : null;
  const portalHref = portalPath?.startsWith('http')
    ? portalPath
    : portalPath
      ? `${WWW_ORIGIN.replace(/\/$/, '')}${portalPath}`
      : `${WWW_ORIGIN}/portals`;

  useEffect(() => {
    if (isAdminPortalRole) {
      const timer = window.setTimeout(() => {
        window.location.href = adminDashboardHref;
      }, 800);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [adminDashboardHref, isAdminPortalRole]);

  const message = useMemo(() => {
    if (isAdminPortalRole) {
      return 'Your admin role is valid. Redirecting you back to the admin dashboard now.';
    }
    if (role && !ADMIN_PORTAL_ROLES.has(role)) {
      return 'Host shops, apprentices, partners, and learners sign in on their assigned portal — not admin.';
    }
    return 'Contact your administrator if you believe this is an error.';
  }, [isAdminPortalRole, role]);

  async function handleSignOut() {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await sb.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-900 mb-4">
          <svg className="w-6 h-6 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 text-sm mb-4">
          {message}
        </p>
        {email && (
          <p className="text-slate-500 text-xs mb-4">
            Signed in as <span className="text-slate-300">{email}</span>
            {role ? (
              <>
                {' '}
                (<span className="text-slate-400">{role}</span>)
              </>
            ) : null}
          </p>
        )}
        {isAdminPortalRole ? (
          <a
            href={adminDashboardHref}
            className="block w-full mb-3 px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
          >
            Return to admin dashboard
          </a>
        ) : portalHref && role && !['admin', 'super_admin', 'staff', 'org_admin', 'platform_operator', 'instructor'].includes(role) ? (
          <a
            href={portalHref}
            className="block w-full mb-3 px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
          >
            Go to your portal
          </a>
        ) : null}
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 bg-red-900 hover:bg-red-800 text-red-200 text-sm font-medium rounded-lg transition-colors"
        >
          Sign out and use a different account
        </button>
      </div>
    </div>
  );
}
