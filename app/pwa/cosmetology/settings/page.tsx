'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, Bell, Shield, LogOut, ChevronRight, Scissors, Clock, BookOpen, TrendingUp } from 'lucide-react';

const NAV = [
  { href: '/pwa/cosmetology', icon: Scissors, label: 'Home' },
  { href: '/pwa/cosmetology/log-hours', icon: Clock, label: 'Log' },
  { href: '/pwa/cosmetology/training', icon: BookOpen, label: 'Learn' },
  { href: '/pwa/cosmetology/progress', icon: TrendingUp, label: 'Progress' },
];

export default function CosmetologySettingsPage() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
  };

  const sections = [
    {
      title: 'Account',
      items: [
        { icon: Shield, label: 'Profile & Contact Info', href: '/pwa/cosmetology/profile' },
        { icon: Shield, label: 'Change Password', href: '/account/security' },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: Bell, label: 'Enable Push Notifications', href: undefined,
          action: () => Notification.requestPermission(),
        },
      ],
    },
    {
      title: 'Program',
      items: [
        { icon: Scissors, label: 'State Board Info', href: '/pwa/cosmetology/state-board' },
        { icon: Scissors, label: 'Program Details', href: '/programs/cosmetology-apprenticeship' },
        { icon: Scissors, label: 'Contact Coordinator', href: '/support' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <Link href="/pwa/cosmetology" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">Settings</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {sections.map(section => (
          <div key={section.title}>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 px-1">{section.title}</p>
            <div className="bg-slate-800 rounded-xl overflow-hidden">
              {section.items.map(({ icon: Icon, label, href, action }: any) => (
                href ? (
                  <Link key={label} href={href} className="flex items-center justify-between px-5 py-4 border-b border-slate-700 last:border-0 hover:bg-slate-700 transition-colors">
                    <div className="flex items-center gap-3"><Icon className="w-5 h-5 text-slate-400" /><span className="text-white text-sm">{label}</span></div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>
                ) : (
                  <button key={label} onClick={action} className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-700 last:border-0 hover:bg-slate-700 transition-colors">
                    <div className="flex items-center gap-3"><Icon className="w-5 h-5 text-slate-400" /><span className="text-white text-sm">{label}</span></div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                )
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center justify-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{signingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>

        <p className="text-center text-slate-600 text-xs">Elevate Cosmetology Apprentice · v1.0</p>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 text-slate-400">
              <Icon className="w-6 h-6" /><span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
