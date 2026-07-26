'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, FileText, BookOpen, DollarSign, 
  Settings, Bell, Search, ChevronDown, LogOut, User,
  Handshake, ShieldCheck, Bot, Activity, Megaphone, Plus, Minus
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Applications', href: '/admin/applications', icon: FileText },
  { label: 'Students', href: '/admin/students', icon: Users },
  { label: 'Programs', href: '/admin/programs', icon: BookOpen },
  { label: 'Funding', href: '/admin/funding', icon: DollarSign },
  { label: 'Partners', href: '/admin/partners', icon: Handshake },
  { label: 'Marketing', href: '/admin/crm', icon: Megaphone },
  { label: 'Compliance', href: '/admin/compliance', icon: ShieldCheck },
  { label: 'Dev Studio', href: '/admin/dev-studio', icon: Bot },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [navExpanded, setNavExpanded] = useState(false);

  return (
    <>
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-base">E</span>
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-sm">Elevate</span>
                  <span className="text-orange-400 font-light text-sm">Admin</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden 2xl:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-1">
              {/* Mobile Nav Toggle */}
              <button 
                onClick={() => setNavExpanded(!navExpanded)}
                className="xl:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
                title={navExpanded ? 'Collapse nav' : 'Expand nav'}
              >
                {navExpanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
              
              {/* Search */}
              <button className="p-2 rounded-md hover:bg-white/10 transition-colors">
                <Search className="w-4 h-4" />
              </button>
              
              {/* Notifications */}
              <button className="p-2 rounded-md hover:bg-white/10 transition-colors relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
              </button>

              {/* Profile */}
              <div className="relative">
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-white/10 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 hidden sm:block" />
                </button>
                
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                    <Link href="/admin/profile" className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">
                      <User className="w-3.5 h-3.5" />
                      Profile
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </Link>
                    <hr className="my-1.5" />
                    <button className="flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left">
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Mobile Nav - Scrollable */}
        <div className={`xl:hidden border-t border-slate-800 overflow-hidden transition-all duration-300 ${navExpanded ? 'max-h-96' : 'max-h-0'}`}>
          <div className="px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setNavExpanded(false)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
