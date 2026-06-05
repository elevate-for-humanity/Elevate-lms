'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, Bell, LogOut, Search, Settings } from 'lucide-react';
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
  /** Nav sections from DB (platform_settings). Falls back to DEFAULT_NAV when absent. */
  navSections?: NavSection[];
}


function isActive(pathname: string, href: string) {
  if (href === '/admin/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

function isSectionActive(pathname: string, section: NavSection) {
  return section.items.some((item) => isActive(pathname, item.href));
}

export default function AdminNav({ userName = 'Admin', notifs = [], navSections }: AdminNavProps) {
  const NAV = navSections ?? DEFAULT_NAV;
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState('');
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
        setMobileOpen(false);
      }
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Desktop: never leave body scroll locked after resizing from mobile menu
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => {
      if (mq.matches) {
        setMobileOpen(false);
        document.body.style.overflow = '';
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/admin/students?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200 shadow-sm">
        <div className="h-full flex items-center gap-2 px-4 sm:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 flex-shrink-0 mr-4">
            <LogoImage alt="Elevate" width={28} height={42} className="w-auto h-8" />
            <span className="font-bold text-slate-900 text-sm hidden sm:block">
              Elevate <span className="text-brand-red-600 font-semibold">Admin</span>
            </span>
          </Link>

          <nav
            ref={navRef}
            aria-label="Admin navigation"
            className="hidden md:flex items-center gap-0 flex-1 overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {NAV.map((section) => {
              const active = isSectionActive(pathname, section);
              const open = openDropdown === section.label;
              return (
                <div key={section.label} className="relative flex-shrink-0 flex items-center">
                  {/* Section label — navigates to section.href */}
                  <Link
                    href={section.href}
                    className={`px-3 py-2 rounded-l-lg text-xs font-semibold whitespace-nowrap transition-colors ${active ? 'text-brand-red-700 bg-brand-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                  >
                    {section.label}
                  </Link>
                  {/* Chevron — opens dropdown */}
                  <button
                    onClick={() => setOpenDropdown(open ? null : section.label)}
                    aria-label={`Open ${section.label} menu`}
                    className={`px-1 py-2 rounded-r-lg text-xs transition-colors ${active ? 'text-brand-red-700 bg-brand-red-50' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                  >
                    <ChevronDown
                      className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
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

          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-slate-400 transition-all"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students…"
                className="w-28 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </form>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-red-500 ring-2 ring-white" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    <Link
                      href="/admin/notifications"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifs.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">
                        All caught up
                      </div>
                    ) : (
                      notifs.map((n) => (
                        <Link
                          key={n.id}
                          href={n.href}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm truncate ${n.unread ? 'font-semibold text-slate-900' : 'text-slate-500'}`}
                            >
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">{n.time}</p>
                          </div>
                          {n.unread && (
                            <span className="mt-2 w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                          )}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center gap-1 pl-3 border-l border-slate-200">
              <Link
                href="/admin/settings"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <span className="text-sm text-slate-700 px-1 hidden xl:block">{userName}</span>
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="fixed top-16 right-0 bottom-0 w-[85vw] max-w-sm bg-white border-l border-slate-200 z-50 md:hidden overflow-y-auto shadow-2xl"
          >
        <div className="p-4 space-y-1">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 mb-4"
          >
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students…"
              className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </form>

          {/* Quick-access shortcuts — top-level section links from NAV so they
               stay in sync with whatever nav config is active (DB or default) */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {NAV.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-center ${
                  isSectionActive(pathname, section)
                    ? 'bg-brand-red-50 text-brand-red-700'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {section.label}
              </Link>
            ))}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1 mb-2">All Pages</p>

          {NAV.map((section) => {
            const active = isSectionActive(pathname, section);
            return (
              <div
                key={section.label}
                className="border-b border-slate-200 pb-2 mb-2 last:border-0"
              >
                <Link
                  href={section.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-bold transition-colors ${active ? 'text-brand-red-700 bg-brand-red-50' : 'text-slate-800 hover:bg-slate-100'}`}
                >
                  {section.label}
                </Link>
                <div className="ml-2 mt-1 space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block px-3 py-2 rounded-xl text-sm transition-colors ${isActive(pathname, item.href) ? 'bg-brand-red-50 text-brand-red-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="pt-4 space-y-2 border-t border-slate-200">
            <Link
              href="/admin/settings"
              className="block px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-rose-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
          </div>
        </>
      )}
    </>
  );
}
