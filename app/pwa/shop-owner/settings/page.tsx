'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Bell, BellOff, Moon, Sun, LogOut, 
  User, Shield, HelpCircle, ChevronRight, Loader2,
  Building2, Clock, Users, FileText, QrCode, 
  MapPin, Phone, Mail, Edit2
} from 'lucide-react';
import { usePushNotifications } from '@/components/pwa/PushNotifications';

export default function ShopOwnerSettingsPage() {
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications();
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string; shopName?: string } | null>(null);
  const [shop, setShop] = useState<{
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    licenseNumber?: string;
  } | null>(null);

  useEffect(() => {
    // Fetch user and shop info
    Promise.all([
      fetch('/api/auth/me').then(res => res.ok ? res.json() : null),
      fetch('/api/pwa/shop-owner/dashboard').then(res => res.ok ? res.json() : null),
    ]).then(([authData, dashboardData]) => {
      if (authData?.user) {
        setUser({
          name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User',
          email: authData.user.email || '',
          shopName: dashboardData?.shop?.name,
        });
      }
      if (dashboardData?.shop) {
        setShop(dashboardData.shop);
      }
    }).catch(() => {});
  }, []);

  const handleNotificationToggle = async () => {
    if (subscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      window.location.href = '/pwa/shop-owner';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {/* Header */}
      <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <Link href="/pwa/shop-owner" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-xl font-bold text-white">Settings</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Profile Section */}
        {user && (
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-blue-500/20 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-brand-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium text-lg">{user.name}</p>
                <p className="text-slate-400 text-sm">{user.email}</p>
                {user.shopName && (
                  <p className="text-brand-blue-400 text-sm mt-1">{user.shopName}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Shop Management */}
        <div>
          <h2 className="text-slate-400 text-sm font-medium mb-3 px-1">SHOP MANAGEMENT</h2>
          <div className="bg-slate-800 rounded-xl overflow-hidden divide-y divide-slate-700">
            <Link href="/pwa/shop-owner/checkin" className="flex items-center justify-between p-4 active:bg-slate-700">
              <div className="flex items-center gap-4">
                <QrCode className="w-5 h-5 text-brand-blue-400" />
                <div className="text-left">
                  <p className="text-white font-medium">Check-In QR Code</p>
                  <p className="text-slate-400 text-sm">Display for apprentice check-ins</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </Link>
            <Link href="/pwa/shop-owner/settings/shop" className="flex items-center justify-between p-4 active:bg-slate-700">
              <div className="flex items-center gap-4">
                <Building2 className="w-5 h-5 text-slate-400" />
                <div className="text-left">
                  <p className="text-white font-medium">Shop Details</p>
                  <p className="text-slate-400 text-sm">{shop?.name || 'Edit shop information'}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-slate-400 text-sm font-medium mb-3 px-1">NOTIFICATIONS</h2>
          <div className="bg-slate-800 rounded-xl overflow-hidden">
            {supported ? (
              <button
                onClick={handleNotificationToggle}
                disabled={loading || permission === 'denied'}
                className="w-full flex items-center justify-between p-4 active:bg-slate-700"
              >
                <div className="flex items-center gap-4">
                  {subscribed ? (
                    <Bell className="w-5 h-5 text-brand-blue-400" />
                  ) : (
                    <BellOff className="w-5 h-5 text-slate-400" />
                  )}
                  <div className="text-left">
                    <p className="text-white font-medium">Push Notifications</p>
                    <p className="text-slate-400 text-sm">
                      {permission === 'denied' 
                        ? 'Blocked in browser settings' 
                        : subscribed 
                          ? 'Get alerts for hour submissions' 
                          : 'Disabled'}
                    </p>
                  </div>
                </div>
                {loading ? (
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                ) : (
                  <div className={`w-12 h-7 rounded-full p-1 transition-colors ${
                    subscribed ? 'bg-brand-blue-600' : 'bg-slate-600'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      subscribed ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                )}
              </button>
            ) : (
              <div className="p-4 text-slate-400 text-sm">
                Push notifications are not supported on this device
              </div>
            )}
          </div>
        </div>

        {/* Appearance */}
        <div>
          <h2 className="text-slate-400 text-sm font-medium mb-3 px-1">APPEARANCE</h2>
          <div className="bg-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-between p-4 active:bg-slate-700"
            >
              <div className="flex items-center gap-4">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-brand-blue-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-400" />
                )}
                <div className="text-left">
                  <p className="text-white font-medium">Dark Mode</p>
                  <p className="text-slate-400 text-sm">{darkMode ? 'On' : 'Off'}</p>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full p-1 transition-colors ${
                darkMode ? 'bg-brand-blue-600' : 'bg-slate-600'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </button>
          </div>
        </div>

        {/* Support */}
        <div>
          <h2 className="text-slate-400 text-sm font-medium mb-3 px-1">SUPPORT</h2>
          <div className="bg-slate-800 rounded-xl overflow-hidden divide-y divide-slate-700">
            <Link href="/help" className="flex items-center justify-between p-4 active:bg-slate-700">
              <div className="flex items-center gap-4">
                <HelpCircle className="w-5 h-5 text-slate-400" />
                <p className="text-white font-medium">Help Center</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </Link>
            <Link href="/privacy-policy" className="flex items-center justify-between p-4 active:bg-slate-700">
              <div className="flex items-center gap-4">
                <Shield className="w-5 h-5 text-slate-400" />
                <p className="text-white font-medium">Privacy Policy</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 bg-brand-red-500/10 border border-brand-red-500/30 text-brand-red-400 font-medium py-4 rounded-xl"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>

        {/* App Version */}
        <p className="text-center text-slate-500 text-sm">
          Elevate Partner Shop v1.0.0
        </p>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/shop-owner" className="flex flex-col items-center gap-1 text-slate-400">
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
