'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Award, Clock, TrendingUp, Loader2, AlertCircle, Flower2, BookOpen } from 'lucide-react';

interface ProfileData {
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
  { href: '/pwa/esthetician', icon: Flower2, label: 'Home' },
  { href: '/pwa/esthetician/log-hours', icon: Clock, label: 'Log' },
  { href: '/pwa/esthetician/training', icon: BookOpen, label: 'Learn' },
  { href: '/pwa/esthetician/progress', icon: TrendingUp, label: 'Progress' },
];

export default function EstheticianProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/pwa/esthetician/dashboard')
      .then((r) => r.json())
      .then((data) => {
        setProfile({
          name: data.name ?? 'Apprentice',
          email: data.email ?? '',
          phone: data.phone,
          shopName: data.shopName ?? 'Training Site',
          shopCity: data.shopCity,
          shopState: data.shopState ?? 'IN',
          startDate: data.startDate ?? '',
          totalHours: data.totalHours ?? 0,
          targetHours: 700,
          milestonesAchieved: data.milestonesAchieved ?? 0,
          totalMilestones: 7,
        });
      })
      .catch(() => setError('Unable to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-rose-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-rose-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/pwa/esthetician" className="w-10 h-10 bg-rose-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">My Profile</h1>
        </div>
        {profile && (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">{profile.name}</p>
              <p className="text-rose-200 text-sm">Esthetician Apprentice</p>
            </div>
          </div>
        )}
      </header>

      <main className="px-4 py-6 space-y-4">
        {error && (
          <div className="bg-red-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {profile && (
          <>
            <div className="bg-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-white font-bold">Contact</h2>
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <Mail className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-3 text-slate-300 text-sm">
                  <Phone className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-white font-bold">Training Site</h2>
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{profile.shopName}{profile.shopCity ? ` · ${profile.shopCity}, ${profile.shopState}` : ''}</span>
              </div>
              {profile.startDate && (
                <div className="flex items-center gap-3 text-slate-300 text-sm">
                  <Calendar className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>Started {new Date(profile.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-800 rounded-xl p-5 space-y-3">
              <h2 className="text-white font-bold">Progress Summary</h2>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Hours Logged</span>
                <span className="text-white font-bold">{profile.totalHours} / {profile.targetHours}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${Math.min((profile.totalHours / profile.targetHours) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Award className="w-4 h-4 text-rose-400" />
                <span>{profile.milestonesAchieved} of {profile.totalMilestones} milestones achieved</span>
              </div>
            </div>
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex safe-area-inset-bottom">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center py-3 text-slate-400 hover:text-rose-400 transition">
            <Icon className="w-5 h-5" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
