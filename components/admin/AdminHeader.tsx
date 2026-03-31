"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Bell, ChevronDown, Search, Settings, LogOut, ExternalLink,
} from "lucide-react";
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
}

function toTitleCase(segment: string) {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminHeader({ userName = "Admin", userInitial = "A", notifs = [] }: AdminHeaderProps) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const crumbs = (() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts
      .filter(p => !/^[0-9a-f-]{36}$/i.test(p))
      .map((part, i, arr) => ({
        href: "/" + parts.slice(0, parts.indexOf(part) + 1).join("/"),
        label: toTitleCase(part),
        last: i === arr.length - 1,
      }));
  })();

  const pageTitle = crumbs[crumbs.length - 1]?.label ?? "Admin";
  const unread = notifs.filter(n => n.unread).length;

  // Close dropdowns on outside click
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
    <header className="fixed top-0 left-0 right-0 lg:left-64 z-30 h-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* Left: breadcrumb + page title */}
        <div className="min-w-0 pl-12 lg:pl-0">
          <nav className="mb-1 flex flex-wrap items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-300">/</span>}
                {c.last
                  ? <span className="font-semibold text-slate-700">{c.label}</span>
                  : <Link href={c.href} className="hover:text-slate-700 transition-colors">{c.label}</Link>}
              </span>
            ))}
          </nav>
          <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900">{pageTitle}</h1>
        </div>

        {/* Right: search + bell + avatar */}
        <div className="flex items-center gap-3 flex-shrink-0">

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search admin…"
              className="w-48 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
          </form>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button type="button"
              onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
              aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Notifications</div>
                    <div className="text-xs text-slate-500">Recent admin alerts</div>
                  </div>
                  <Link href="/admin/notifications" onClick={() => setNotifOpen(false)}
                    className="text-xs font-medium text-cyan-700 hover:text-cyan-800">View all</Link>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifs.length === 0
                    ? <div className="px-4 py-8 text-center text-xs text-slate-400">All caught up</div>
                    : notifs.map(n => (
                      <Link key={n.id} href={n.href} onClick={() => setNotifOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${n.unread ? "text-slate-900" : "text-slate-600"}`}>{n.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{n.time}</p>
                        </div>
                        {n.unread && <span className="mt-1.5 h-2 w-2 rounded-full bg-rose-500 flex-shrink-0" />}
                      </Link>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button type="button"
              onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm hover:bg-slate-50 transition-colors">
              <div className="h-7 w-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {userInitial}
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-medium text-slate-800 leading-tight">{userName}</div>
                <div className="text-xs text-slate-500">Administrator</div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl z-50">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{userName}</p>
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
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors">
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
