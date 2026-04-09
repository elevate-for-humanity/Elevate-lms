import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  LayoutDashboard, BookOpen, ShieldCheck, Settings, Users, LogOut,
} from 'lucide-react';

const NAV = [
  { href: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/provider/programs', label: 'Programs', icon: BookOpen },
  { href: '/provider/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/provider/staff', label: 'Staff', icon: Users },
  { href: '/provider/settings', label: 'Settings', icon: Settings },
];

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/provider/dashboard');

  const db = await getAdminClient();
  const { data: profile } = await db!
    .from('profiles')
    .select('role, tenant_id, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'provider_admin') {
    redirect('/unauthorized');
  }

  // Fetch tenant name for the sidebar header
  const { data: tenant } = await db!
    .from('tenants')
    .select('name, slug, status')
    .eq('id', profile.tenant_id)
    .single();

  if (!tenant || tenant.status === 'suspended') {
    // Suspended providers see a holding page, not the portal
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md text-center px-4">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Account Suspended</h1>
          <p className="text-slate-600 text-sm">
            Your provider account has been suspended. Contact{' '}
            <a href="mailto:elevate4humanityedu@gmail.com" className="text-brand-blue-600 hover:underline">
              support@elevateforhumanity.org
            </a>{' '}
            for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white flex-shrink-0 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-700">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Provider Portal</div>
          <div className="text-white font-semibold text-sm truncate">{tenant.name}</div>
          <div className="text-slate-400 text-xs truncate mt-0.5">{profile.email}</div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm"
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-2 py-4 border-t border-slate-700">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition text-sm w-full"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
