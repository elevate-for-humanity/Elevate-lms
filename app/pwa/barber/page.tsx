'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Scissors, Clock, BookOpen, Award, Calendar, 
  ChevronRight, Plus, User, Bell, Settings,
  TrendingUp, AlertCircle, Loader2,
  LogIn, UserPlus, Star
} from 'lucide-react';

const TARGET_HOURS = 2000;

function formatHours(hours: number): string {
  return hours.toLocaleString();
}

interface ApprenticeData {
  name: string;
  totalHours: number;
  weeklyHours: number;
  startDate: string | null;
  shopName: string;
  nextMilestone: number;
}

// Public Landing Page Component
function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-white px-6 pt-16 pb-12 text-center">
        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Scissors className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">Barber Apprentice</h1>
        <p className="text-brand-blue-200 text-lg max-w-xs mx-auto">
          Track your hours, access training, and progress toward your barber license.
        </p>
      </div>

      {/* Features */}
      <div className="px-6 py-8 space-y-4">
        <div className="flex items-start gap-4 bg-white rounded-xl p-4">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-brand-green-400" />
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold">Track Your Hours</h3>
            <p className="text-slate-500 text-sm">Log training hours and see your progress toward 2,000 hours.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 bg-white rounded-xl p-4">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-brand-blue-400" />
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold">Training Materials</h3>
            <p className="text-slate-500 text-sm">Access Milady curriculum and instructional videos.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 bg-white rounded-xl p-4">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold">Earn Milestones</h3>
            <p className="text-slate-500 text-sm">Unlock achievements as you progress through your apprenticeship.</p>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="px-6 pb-8 space-y-3">
        <Link
          href="/login?redirect=/pwa/barber/dashboard"
          className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700"
        >
          <LogIn className="w-5 h-5" />
          Sign In
        </Link>
        
        <Link
          href="/pwa/barber/enroll"
          className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white font-medium py-4 rounded-xl border border-slate-700 hover:bg-slate-700"
        >
          <UserPlus className="w-5 h-5" />
          Enroll in Program
        </Link>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 text-center">
        <p className="text-slate-500 text-sm">
          Part of the USDOL Registered Barber Apprenticeship
        </p>
        <Link href="/" className="text-brand-blue-400 text-sm hover:underline">
          elevateforhumanity.org
        </Link>
      </div>
    </div>
  );
}

// Dashboard Component (for logged-in users)
function Dashboard({ apprentice, onLogout }: { apprentice: ApprenticeData; onLogout: () => void }) {
  const totalHours = apprentice.totalHours || 0;
  const progressPercent = (totalHours / TARGET_HOURS) * 100;
  const hoursRemaining = TARGET_HOURS - totalHours;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-brand-blue-600 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-brand-blue-200 text-sm">Welcome back,</p>
              <h1 className="text-slate-900 font-bold text-lg">{apprentice.name}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/pwa/barber/notifications" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </Link>
            <Link href="/pwa/barber/settings" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </Link>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-brand-blue-200 text-sm">Progress to Licensure</span>
            <span className="text-white font-bold">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white font-bold">{formatHours(totalHours)} hrs</span>
            <span className="text-brand-blue-200">{formatHours(TARGET_HOURS)} hrs goal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-brand-blue-400" />
              <span className="text-slate-500 text-sm">This Week</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{apprentice.weeklyHours || 0} hrs</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-brand-green-400" />
              <span className="text-slate-500 text-sm">Remaining</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatHours(hoursRemaining)} hrs</p>
          </div>
        </div>

        {/* Next Milestone */}
        {apprentice.nextMilestone && (
          <div className="bg-white/20 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-amber-200 text-sm">Next Milestone</p>
                <p className="text-slate-900 font-bold">{formatHours(apprentice.nextMilestone)} Hours</p>
              </div>
              <div className="text-right">
                <p className="text-amber-200 text-sm">
                  {formatHours(Math.max(0, apprentice.nextMilestone - totalHours))} to go
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-slate-900 font-bold text-lg">Quick Actions</h2>
          
          <Link href="/pwa/barber/checkin" className="flex items-center gap-4 bg-brand-green-500/20 border border-brand-green-500/30 rounded-xl p-4 active:opacity-80">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-slate-500 flex-shrink-0">•</span>
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">Check In</p>
              <p className="text-brand-green-300 text-sm">Start tracking your hours</p>
            </div>
            <ChevronRight className="w-5 h-5 text-brand-green-400" />
          </Link>

          <Link href="/pwa/barber/hours/submit" className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-brand-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">Submit Hours</p>
              <p className="text-slate-500 text-sm">Log hours with photo proof</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>

          <Link href="/pwa/barber/log-hours" className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-brand-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">Quick Log</p>
              <p className="text-slate-500 text-sm">Record today's training</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>

          <Link href="/pwa/barber/progress" className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-brand-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">View Progress</p>
              <p className="text-slate-500 text-sm">Detailed hour breakdown</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>

          <Link href="/pwa/barber/training" className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-brand-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">Training Materials</p>
              <p className="text-slate-500 text-sm">Milady curriculum & videos</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>

          <Link href="/pwa/barber/history" className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">Hour History</p>
              <p className="text-slate-500 text-sm">View all logged hours</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>

          <Link href="/pwa/barber/milestones" className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">Milestones</p>
              <p className="text-slate-500 text-sm">Track achievements & rewards</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>

          <Link href="/pwa/barber/reports" className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">Reports</p>
              <p className="text-slate-500 text-sm">Export & view summaries</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>

          <Link href="/pwa/barber/profile" className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">My Profile</p>
              <p className="text-slate-500 text-sm">View your apprentice profile</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>
        </div>

        {/* Shop Info */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Scissors className="w-5 h-5 text-brand-blue-400" />
            <span className="text-slate-500 text-sm">Training Location</span>
          </div>
          <p className="text-slate-900 font-medium">{apprentice.shopName}</p>
          {apprentice.startDate && (
            <p className="text-slate-500 text-sm mt-1">
              Started {new Date(apprentice.startDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/barber" className="flex flex-col items-center gap-1 text-brand-blue-400">
            <Scissors className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/barber/log-hours" className="flex flex-col items-center gap-1 text-slate-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/barber/training" className="flex flex-col items-center gap-1 text-slate-400">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs">Learn</span>
          </Link>
          <Link href="/pwa/barber/progress" className="flex flex-col items-center gap-1 text-slate-400">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Progress</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default function BarberPWAHome() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [apprentice, setApprentice] = useState<ApprenticeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/pwa/barber/progress');
        
        if (response.status === 401) {
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }

        if (response.status === 404) {
          // Logged in but not enrolled
          setIsLoggedIn(true);
          setApprentice(null);
          setLoading(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setApprentice({
            name: data.apprentice?.name || 'Apprentice',
            totalHours: data.apprentice?.totalHours || 0,
            weeklyHours: data.apprentice?.weeklyHours || 0,
            startDate: data.apprentice?.startDate || null,
            shopName: data.apprentice?.shopName || 'Not assigned',
            nextMilestone: data.apprentice?.nextMilestone || 500,
          });
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-900">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show landing page
  if (!isLoggedIn) {
    return <LandingPage />;
  }

  // Logged in but not enrolled
  if (!apprentice) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Not Enrolled</h1>
          <p className="text-slate-500 mb-6">
            You're signed in but not enrolled in the Barber Apprenticeship program.
          </p>
          <Link
            href="/programs/barber-apprenticeship"
            className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-medium"
          >
            Enroll Now
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  // Logged in and enrolled - show dashboard
  return <Dashboard apprentice={apprentice} onLogout={() => setIsLoggedIn(false)} />;
}
