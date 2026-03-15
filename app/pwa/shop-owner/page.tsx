'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, Users, Clock, Plus, ChevronRight, 
  Bell, Settings, TrendingUp, FileText,
  AlertCircle, Loader2, LogIn, UserPlus, Scissors, QrCode
} from 'lucide-react';

interface Apprentice {
  id: string;
  name: string;
  totalHours: number;
  weeklyHours: number;
  status: string;
  progress: number;
}

interface ShopData {
  id: string;
  name: string;
  status: string;
}

// Public Landing Page Component
function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-white px-6 pt-16 pb-12 text-center">
        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">Partner Shop</h1>
        <p className="text-brand-blue-200 text-lg max-w-xs mx-auto">
          Manage apprentices, log hours, and track training progress at your barbershop.
        </p>
      </div>

      {/* Features */}
      <div className="px-6 py-8 space-y-4">
        <div className="flex items-start gap-4 bg-white rounded-xl p-4">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-brand-green-400" />
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold">Log Apprentice Hours</h3>
            <p className="text-slate-500 text-sm">Record weekly training hours for your apprentices.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 bg-white rounded-xl p-4">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-brand-blue-400" />
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold">Manage Your Team</h3>
            <p className="text-slate-500 text-sm">View all apprentices assigned to your shop.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 bg-white rounded-xl p-4">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-brand-blue-400" />
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold">Compliance Reports</h3>
            <p className="text-slate-500 text-sm">Generate reports for RAPIDS and state requirements.</p>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="px-6 pb-8 space-y-3">
        <Link
          href="/login?redirect=/pwa/shop-owner/dashboard"
          className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700"
        >
          <LogIn className="w-5 h-5" />
          Sign In
        </Link>
        
        <Link
          href="/partner/onboarding"
          className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white font-medium py-4 rounded-xl border border-slate-700 hover:bg-slate-700"
        >
          <UserPlus className="w-5 h-5" />
          Become a Partner Shop
        </Link>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 text-center">
        <p className="text-slate-500 text-sm">
          Host apprentices through the USDOL Registered Apprenticeship
        </p>
        <Link href="/" className="text-brand-blue-400 text-sm hover:underline">
          elevateforhumanity.org
        </Link>
      </div>
    </div>
  );
}

// Dashboard Component (for logged-in partners)
function Dashboard({ 
  shop, 
  apprentices, 
  pendingEntries, 
  totalHoursThisWeek 
}: { 
  shop: ShopData;
  apprentices: Apprentice[];
  pendingEntries: number;
  totalHoursThisWeek: number;
}) {
  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-slate-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-brand-blue-200 text-sm">Partner Shop</p>
              <h1 className="text-slate-900 font-bold text-lg">{shop.name}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/pwa/shop-owner/notifications" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-white" />
              {pendingEntries > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {pendingEntries}
                </span>
              )}
            </Link>
            <Link href="/pwa/shop-owner/settings" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-brand-blue-200" />
              <span className="text-brand-blue-200 text-xs">Active Apprentices</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{apprentices.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-brand-blue-200" />
              <span className="text-brand-blue-200 text-xs">Hours This Week</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalHoursThisWeek}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Pending Alert */}
        {pendingEntries > 0 && (
          <div className="bg-white/20 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <div className="flex-1">
                <p className="text-amber-200 font-medium">Pending Entries</p>
                <p className="text-amber-300 text-sm">{pendingEntries} hours need verification</p>
              </div>
              <Link href="/pwa/shop-owner" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Review
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-slate-900 font-bold text-lg">Quick Actions</h2>
          
          <Link href="/pwa/shop-owner/approve-hours" className="flex items-center gap-4 bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 active:opacity-80">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-slate-500 flex-shrink-0">•</span>
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">Approve Hours</p>
              <p className="text-amber-300 text-sm">Review pending submissions</p>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400" />
          </Link>

          <Link href="/pwa/shop-owner/checkin" className="flex items-center gap-4 bg-brand-blue-500/20 border border-brand-blue-500/30 rounded-xl p-4 active:opacity-80">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">Check-In QR Code</p>
              <p className="text-brand-blue-300 text-sm">Display for apprentices</p>
            </div>
            <ChevronRight className="w-5 h-5 text-brand-blue-400" />
          </Link>

          <Link href="/pwa/shop-owner/log-hours" className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-brand-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">Log Apprentice Hours</p>
              <p className="text-slate-500 text-sm">Record training hours</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>

          <Link href="/pwa/shop-owner/apprentices" className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">My Apprentices</p>
              <p className="text-slate-500 text-sm">View all apprentices</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>

          <Link href="/pwa/shop-owner/reports" className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-brand-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">Reports</p>
              <p className="text-slate-500 text-sm">Hours & compliance reports</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>

          <Link href="/pwa/shop-owner/progress" className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium">Shop Progress</p>
              <p className="text-slate-500 text-sm">Track team advancement</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>
        </div>

        {/* Apprentices List */}
        {apprentices.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900 font-bold text-lg">Apprentices</h2>
              <Link href="/pwa/shop-owner/apprentices" className="text-brand-blue-400 text-sm">View All</Link>
            </div>
            
            <div className="space-y-3">
              {apprentices.slice(0, 3).map((apprentice) => (
                <Link 
                  key={apprentice.id}
                  href={`/pwa/shop-owner/apprentices/${apprentice.id}`}
                  className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-brand-blue-400 font-bold text-lg">
                      {apprentice.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-900 font-medium">{apprentice.name}</p>
                    <p className="text-slate-500 text-sm">{apprentice.totalHours.toLocaleString()} total hours</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-900 font-bold">{apprentice.weeklyHours}</p>
                    <p className="text-slate-500 text-xs">this week</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No apprentices assigned yet</p>
            <p className="text-slate-500 text-sm mt-1">Apprentices will appear here once assigned to your shop</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/shop-owner" className="flex flex-col items-center gap-1 text-brand-blue-400">
            <Building2 className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/shop-owner/log-hours" className="flex flex-col items-center gap-1 text-slate-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/shop-owner/apprentices" className="flex flex-col items-center gap-1 text-slate-400">
            <Users className="w-6 h-6" />
            <span className="text-xs">Team</span>
          </Link>
          <Link href="/pwa/shop-owner/reports" className="flex flex-col items-center gap-1 text-slate-400">
            <FileText className="w-6 h-6" />
            <span className="text-xs">Reports</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default function ShopOwnerPWAHome() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isPartner, setIsPartner] = useState(false);
  const [shop, setShop] = useState<ShopData | null>(null);
  const [apprentices, setApprentices] = useState<Apprentice[]>([]);
  const [pendingEntries, setPendingEntries] = useState(0);
  const [totalHoursThisWeek, setTotalHoursThisWeek] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/pwa/shop-owner/dashboard');
        
        if (response.status === 401) {
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }

        if (response.status === 404) {
          // Logged in but not a partner
          setIsLoggedIn(true);
          setIsPartner(false);
          setLoading(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setIsPartner(true);
          setShop(data.shop);
          setApprentices(data.apprentices || []);
          setPendingEntries(data.pendingEntries || 0);
          setTotalHoursThisWeek(data.totalHoursThisWeek || 0);
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

  // Logged in but not a partner
  if (!isPartner || !shop) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Not a Partner</h1>
          <p className="text-slate-500 mb-6">
            You're signed in but not registered as a partner shop.
          </p>
          <Link
            href="/partner/onboarding"
            className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-medium"
          >
            Become a Partner
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  // Logged in and is a partner - show dashboard
  return (
    <Dashboard 
      shop={shop} 
      apprentices={apprentices} 
      pendingEntries={pendingEntries}
      totalHoursThisWeek={totalHoursThisWeek}
    />
  );
}
