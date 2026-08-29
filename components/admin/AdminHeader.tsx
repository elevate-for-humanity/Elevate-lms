'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  DollarSign,
  Settings,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Handshake,
  ShieldCheck,
  Bot,
  Megaphone,
  Plus,
  Minus,
  Globe,
  X,
  ClipboardList,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useI18n, LOCALES, LOCALE_NAMES, LOCALE_FLAGS, type Locale } from '@/lib/i18n/context';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Applications', href: '/applications', icon: FileText },
  { label: 'Students', href: '/students', icon: Users },
  { label: 'Programs', href: '/programs', icon: BookOpen },
  { label: 'Funding', href: '/funding', icon: DollarSign },
  { label: 'Surveys', href: '/surveys/workone', icon: ClipboardList },
  { label: 'Partners', href: '/partners', icon: Handshake },
  { label: 'Marketing', href: '/crm', icon: Megaphone },
  { label: 'Compliance', href: '/compliance', icon: ShieldCheck },
  { label: 'Dev Studio', href: '/studio', icon: Bot },
] as const;

function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md p-2 transition-colors hover:bg-white/10"
        title="Change language"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden text-xs lg:block">{LOCALE_FLAGS[locale]}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-[70] mt-2 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={`flex min-h-11 w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-slate-50 ${
                loc === locale ? 'bg-orange-50 text-orange-700' : 'text-slate-700'
              }`}
            >
              <span>{LOCALE_FLAGS[loc]}</span>
              <span>{LOCALE_NAMES[loc]}</span>
              {loc === locale && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [navExpanded, setNavExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNavExpanded(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/students?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="flex min-h-16 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
                  <span className="text-base font-black text-white">E</span>
                </div>
                <div className="hidden min-w-0 sm:block">
                  <div className="leading-tight">
                    <span className="text-sm font-black">Elevate </span>
                    <span className="text-sm font-bold text-orange-300">Admin</span>
                  </div>
                  <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                    <ShieldCheck className="h-3 w-3" /> Secure role-restricted session
                  </span>
                </div>
              </Link>
            </div>

            <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Admin navigation">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex min-h-11 items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-bold transition-all ${
                      isActive ? 'bg-white/20 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden 2xl:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-0.5">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-1 rounded-md bg-white/10 px-1 py-1 sm:gap-2 sm:px-2">
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search students..."
                    className="w-24 bg-transparent text-sm text-white outline-none placeholder:text-slate-400 sm:w-32 lg:w-48"
                  />
                  <button type="submit" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded hover:bg-white/10" aria-label="Submit search"><Search className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setSearchOpen(false)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded hover:bg-white/10" aria-label="Close search"><X className="h-4 w-4" /></button>
                </form>
              ) : (
                <button onClick={() => setSearchOpen(true)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 transition-colors hover:bg-white/10" title="Search" aria-label="Search students"><Search className="h-4 w-4" /></button>
              )}

              <LanguageSwitcher />

              <Link href="/notifications" className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 transition-colors hover:bg-white/10" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Link>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md p-1.5 transition-colors hover:bg-white/10"
                  aria-label="Open admin account menu"
                  aria-expanded={profileOpen}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600"><User className="h-3.5 w-3.5" /></div>
                  <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 z-[70] mt-2 w-[min(13rem,calc(100vw-1rem))] rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="flex items-center gap-1.5 text-xs font-black text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Authenticated session</p>
                    </div>
                    <Link href="/settings" className="flex min-h-11 items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Settings className="h-3.5 w-3.5" /> Settings</Link>
                    <hr className="my-1.5" />
                    <form action="/api/auth/signout" method="post">
                      <button type="submit" className="flex min-h-11 w-full items-center gap-2 px-4 py-2 text-left text-xs font-black text-red-700 hover:bg-red-50"><LogOut className="h-3.5 w-3.5" /> Sign Out Securely</button>
                    </form>
                  </div>
                )}
              </div>

              <button
                onClick={() => setNavExpanded(!navExpanded)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 transition-colors hover:bg-white/10 xl:hidden"
                title={navExpanded ? 'Collapse navigation' : 'Expand navigation'}
                aria-label={navExpanded ? 'Collapse admin navigation' : 'Expand admin navigation'}
                aria-expanded={navExpanded}
              >
                {navExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className={`overflow-hidden border-t border-slate-800 transition-[max-height] duration-200 xl:hidden ${navExpanded ? 'max-h-96' : 'max-h-0'}`}>
          <div className="px-3 py-3 sm:px-4">
            <p className="mb-2 text-xs font-semibold text-slate-400">Choose a workspace:</p>
            <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-2 scrollbar-hide">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setNavExpanded(false)}
                    className={`flex min-h-11 flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                      isActive ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />{item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
