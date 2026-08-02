'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Bell, LogOut, Search, Settings, Plus, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import LogoImage from '@/components/site/LogoImage';
import { DEFAULT_NAV, type NavSection } from '@/lib/admin/nav-config';

export interface AdminNavNotif {
  id: string;
  title: string;
  time: string;
  href: string;
  unread: boolean;
}

interface AdminNavProps {
  userName?: string;
  notifs?: AdminNavNotif[];
  navSections?: NavSection[];
}

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

function isSectionActive(pathname: string, section: NavSection) {
  return section.items.some((item) => isActive(pathname, item.href));
}

export default function AdminNav({ userName = 'Admin', notifs = [], navSections }: AdminNavProps) {
  const NAV = navSections ?? DEFAULT_NAV;
  const pathname = usePathname();
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [navExpanded, setNavExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const unread = notifs.filter((n) => n.unread).length;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenDropdown(null);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setNotifOpen(false);
        setNavExpanded(false);
      }
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setNotifOpen(false);
  }, [pathname]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/students?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="h-14 flex items-center gap-2 px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <LogoImage alt="Elevate" width={28} height={42} className="w-auto h-8" />
            <span className="font-bold text-slate-900 text-sm hidden sm:block">
              Elevate <span className="text-brand-red-600 font-semibold">Admin</span>
            </span>
          </Link>

          {/* Desktop Navigation - Horizontal with dropdowns */}
          <nav
            ref={navRef}
            aria-label="Admin section shortcuts"
            className="hidden xl:flex items-center gap-0 flex-1 overflow-x-auto min-w-0"
            style={{ scrollbarWidth: 'none' }}
          >
            {NAV.map((section) => {
              const active = isSectionActive(pathname, section);
              const open = openDropdown === section.label;
              return (
                <div key={section.label} className="relative flex-shrink-0 flex items-center">
                  <Link
                    href={section.href}
                    className={`px-3 py-2 rounded-l-lg text-xs font-semibold whitespace-nowrap transition-colors ${active ? 'text-brand-red-700 bg-brand-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                  >
                    {section.label}
                  </Link>
                  <button
                    onClick={() => setOpenDropdown(open ? null : section.label)}
                    aria-label={`Open ${section.label} menu`}
                    className={`px-1 py-2 rounded-r-lg text-xs transition-colors ${active ? 'text-brand-red-700 bg-brand-red-50' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                  >
                    <ChevronDown className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 max-h-[75vh] overflow-y-auto">
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block px-4 py-2 text-sm transition-colors ${isActive(pathname, item.href) ? 'bg-brand-red-50 text-brand-red-700 font-semibold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 ml-auto">
            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-24 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </form>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <Bell className="w-4 h-4" />
                {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-red-500 ring-2 ring-white" />}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    <Link href="/notifications" className="text-xs font-semibold text-blue-600">View all</Link>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y">
                    {notifs.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">All caught up</div>
                    ) : (
                      notifs.map((n) => (
                        <Link key={n.id} href={n.href} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${n.unread ? 'font-semibold' : 'text-slate-500'}`}>{n.title}</p>
                            <p className="text-xs text-slate-400">{n.time}</p>
                          </div>
                          {n.unread && <span className="mt-2 w-2 h-2 rounded-full bg-rose-500" />}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings + User */}
            <div className="hidden md:flex items-center gap-1 pl-3 border-l border-slate-200">
              <Link href="/settings" className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                <Settings className="w-4 h-4" />
              </Link>
              <span className="text-sm text-slate-700 px-1 hidden xl:block">{userName}</span>
              <button onClick={signOut} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Nav Toggle */}
            <button
              onClick={() => setNavExpanded(!navExpanded)}
              className="xl:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {navExpanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Horizontal Mobile Nav - Scrollable */}
        <div className={`xl:hidden border-t border-slate-200 overflow-hidden transition-all duration-300 ${navExpanded ? 'max-h-96' : 'max-h-0'}`}>
          <div className="px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {NAV.map((section) => {
                const active = isSectionActive(pathname, section);
                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    onClick={() => setNavExpanded(false)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${
                      active ? 'bg-brand-red-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {section.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
