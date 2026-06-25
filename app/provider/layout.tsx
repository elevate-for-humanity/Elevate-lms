export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LayoutDashboard, BookOpen, ShieldCheck, Settings, Users } from 'lucide-react';

const NAV = [
  { href: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/provider/programs', label: 'Programs', icon: BookOpen },
  { href: '/provider/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/provider/staff', label: 'Staff', icon: Users },
  { href: '/provider/settings', label: 'Settings', icon: Settings },
];

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login?redirect=/provider/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id, full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-white flex">
      <aside className="w-56 bg-slate-900 flex-shrink-0 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-700">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">
            Provider Portal
          </div>
          <div className="text-white font-semibold text-sm truncate">{profile?.full_name || user.email}</div>
          <div className="text-slate-400 text-xs truncate mt-0.5">{user.email}</div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV.map((item) => (
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
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
