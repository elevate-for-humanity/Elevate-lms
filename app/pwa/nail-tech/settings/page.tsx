'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, Bell, Shield, LogOut, ChevronRight, Sparkles, Clock, BookOpen, TrendingUp } from 'lucide-react';

const NAV = [
  { href: '/pwa/nail-tech', icon: Sparkles, label: 'Home' },
  { href: '/pwa/nail-tech/log-hours', icon: Clock, label: 'Log' },
  { href: '/pwa/nail-tech/training', icon: BookOpen, label: 'Learn' },
  { href: '/pwa/nail-tech/progress', icon: TrendingUp, label: 'Progress' },
];

export default function NailTechSettingsPage() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-pink-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/pwa/nail-tech" className="w-10 h-10 bg-pink-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">Settings</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-4">
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <Link href="/pwa/nail-tech/profile" className="flex items-center justify-between p-4 hover:bg-slate-700 transition">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-pink-400" />
              <span className="text-white">My Profile</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <div className="border-t border-slate-700" />
          <button
            onClick={() => {
              if ('Notification' in window) {
                Notification.requestPermission();
              }
            }}
            className="flex items-center justify-between p-4 w-full hover:bg-slate-700 transition"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-pink-400" />
              <span className="text-white">Enable Notifications</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <Link href="/learner/dashboard" className="flex items-center justify-between p-4 hover:bg-slate-700 transition">
            <span className="text-slate-300">Full Dashboard</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <div className="border-t border-slate-700" />
          <Link href="/apprentice" className="flex items-center justify-between p-4 hover:bg-slate-700 transition">
            <span className="text-slate-300">Apprentice Portal</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-3 w-full p-4 bg-slate-800 rounded-xl text-red-400 hover:bg-slate-700 transition disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>

        <p className="text-slate-600 text-xs text-center pt-2">
          Nail Technician Apprenticeship · Elevate for Humanity
        </p>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex safe-area-inset-bottom">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center py-3 text-slate-400 hover:text-pink-400 transition">
            <Icon className="w-5 h-5" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
