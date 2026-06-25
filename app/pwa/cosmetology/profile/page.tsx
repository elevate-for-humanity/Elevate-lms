'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Award, Clock, TrendingUp, Loader2, AlertCircle, Scissors, BookOpen } from 'lucide-react';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  shopName: string;
  shopCity?: string;
  shopState?: string;
  startDate: string;
  totalHours: number;
  targetHours: number;
  milestonesAchieved: number;
  totalMilestones: number;
}

const NAV = [
  { href: '/pwa/cosmetology', icon: Scissors, label: 'Home' },
  { href: '/pwa/cosmetology/log-hours', icon: Clock, label: 'Log' },
  { href: '/pwa/cosmetology/training', icon: BookOpen, label: 'Learn' },
  { href: '/pwa/cosmetology/progress', icon: TrendingUp, label: 'Progress' },
];

export default function CosmetologyProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/pwa/cosmetology/profile');
      if (res.status === 401) { setError('Please sign in to view your profile'); setLoading(false); return; }
      if (!res.ok) throw new Error('Failed to fetch profile');
      setProfile(await res.json());
    } catch { setError('Failed to load profile'); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center"><Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" /><p className="text-white">Loading profile...</p></div>
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-4">Unable to Load</h1>
        <p className="text-slate-400 mb-6">{error ?? 'Profile not found'}</p>
        <Link href="/login?redirect=/pwa/cosmetology/profile" className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl font-medium">Sign In</Link>
      </div>
    </div>
  );

  const progressPct = Math.min((profile.totalHours / profile.targetHours) * 100, 100);

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-purple-700 px-4 pt-12 pb-8 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/pwa/cosmetology" className="w-10 h-10 bg-purple-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">My Profile</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl">{profile.name}</p>
            <p className="text-purple-200 text-sm">Cosmetology Apprentice</p>
            <p className="text-purple-300 text-xs mt-0.5">{profile.shopName}</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-4">
        {/* Progress */}
        <div className="bg-slate-800 rounded-xl p-5">
          <h2 className="text-white font-bold mb-4">Apprenticeship Progress</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">{profile.totalHours.toLocaleString()} hrs logged</span>
            <span className="text-slate-400">{profile.targetHours.toLocaleString()} hrs required</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-700 rounded-lg p-3">
              <p className="text-xl font-bold text-white">{progressPct.toFixed(0)}%</p>
              <p className="text-slate-400 text-xs">Complete</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <p className="text-xl font-bold text-white">{profile.milestonesAchieved}</p>
              <p className="text-slate-400 text-xs">Milestones</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <p className="text-xl font-bold text-white">{Math.max(0, profile.targetHours - profile.totalHours).toLocaleString()}</p>
              <p className="text-slate-400 text-xs">Hrs Left</p>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-white font-bold mb-2">Contact Information</h2>
          {[
            { icon: Mail, label: profile.email },
            ...(profile.phone ? [{ icon: Phone, label: profile.phone }] : []),
            { icon: MapPin, label: (profile as any).salonAssigned && profile.shopCity
              ? `${profile.shopCity}${profile.shopState ? `, ${profile.shopState}` : ''}`
              : 'Salon placement pending' },
            { icon: Calendar, label: `Started ${new Date(profile.startDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' })}` },
          ].map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span className="text-slate-300 text-sm">{label}</span>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          {[
            { href: '/pwa/cosmetology/milestones', icon: Award, label: 'View Milestones' },
            { href: '/pwa/cosmetology/history', icon: Clock, label: 'Hour History' },
            { href: '/pwa/cosmetology/state-board', icon: Scissors, label: 'State Board Info' },
            { href: '/pwa/cosmetology/settings', icon: User, label: 'Settings' },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="flex items-center justify-between px-5 py-4 border-b border-slate-700 last:border-0 hover:bg-slate-700 transition-colors">
              <div className="flex items-center gap-3"><Icon className="w-5 h-5 text-purple-400" /><span className="text-white text-sm">{label}</span></div>
              <span className="text-slate-500">›</span>
            </Link>
          ))}
        </div>
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
