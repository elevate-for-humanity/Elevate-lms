"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Search, Settings, LogOut, ExternalLink, Menu, Moon, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface AdminHeaderNotif {
  id: string;
  title: string;
  time: string;
  href: string;
  unread: boolean;
}

export interface AdminHeaderProps {
  userName?: string;
  userInitial?: string;
  notifs?: AdminHeaderNotif[];
  onMenuClick?: () => void;
  darkMode?: boolean;
  onToggleDark?: () => void;
}

function toTitleCase(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminHeader({ userName = "Admin", userInitial = "A", notifs = [], onMenuClick, darkMode = false, onToggleDark }: AdminHeaderProps) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const crumbs = (() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts
      .filter((p) => !/^[0-9a-f-]{36}$/i.test(p))
      .map((part, i) => ({
        href: "/" + parts.slice(0, parts.indexOf(part) + 1).join("/"),
        label: toTitleCase(part),
        last: i === parts.filter((p) => !/^[0-9a-f-]{36}$/i.test(p)).length - 1,
      }));
  })();

  const pageTitle = crumbs[crumbs.length - 1]?.label ?? "Admin";
  const unread = notifs.filter((n) => n.unread).length;

  useEffect(() => {
    function h(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) window.location.href = `/admin/students?search=${encodeURIComponent(search.trim())}`;
  }

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">

        {/* Hamburger — mobile only */}
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="lg:hidden flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page title — desktop */}
        <div className="hidden lg:block min-w-0 flex-1">
          <nav className="flex items-center gap-1 text-xs text-slate-400 mb-0.5" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-300">/</span>}
                {c.last
                  ? <span className="font-semibold text-slate-700">{c.label}</span>
                  : <Link href={c.href} className="hover:text-slate-600 transition-colors">{c.label}</Link>}
              </span>
            ))}
          </nav>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">{pageTitle}</h1>
        </div>

        {/* Mobile: page title centered */}
        <p className="lg:hidden flex-1 text-base font-bold text-slate-900 truncate">{pageTitle}</p>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 focus-within:border-brand-blue-400 focus-within:ring-2 focus-within:ring-brand-blue-100 transition-all">
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students…"
              className="w-36 bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400" />
          </form>

          {/* Dark mode toggle */}
          {onToggleDark && (
            <button
              type="button"
              onClick={onToggleDark}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button type="button" onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-red-500 ring-2 ring-white" />}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">Notifications</p>
                  <Link href="/admin/notifications" onClick={() => setNotifOpen(false)} className="text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">View all</Link>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifs.length === 0
                    ? <div className="px-4 py-8 text-center text-sm text-slate-400">All caught up</div>
                    : notifs.map((n) => (
                      <Link key={n.id} href={n.href} onClick={() => setNotifOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${n.unread ? "text-slate-900" : "text-slate-500"}`}>{n.title}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{n.time}</p>
                        </div>
                        {n.unread && <span className="mt-2 h-2 w-2 rounded-full bg-brand-red-500 flex-shrink-0" />}
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button type="button" onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 hover:bg-slate-50 transition-colors">
              <div className="h-7 w-7 rounded-full bg-brand-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {userInitial}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-slate-800">{userName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">{userName}</p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
                <Link href="/admin/settings" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Settings className="h-4 w-4 text-slate-400" /> Settings
                </Link>
                <Link href="/" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <ExternalLink className="h-4 w-4 text-slate-400" /> View public site
                </Link>
                <div className="border-t border-slate-100" />
                <button type="button" onClick={signOut}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-brand-red-600 hover:bg-brand-red-50 transition-colors">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
