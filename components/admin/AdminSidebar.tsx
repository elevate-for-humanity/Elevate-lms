"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import {
  LayoutDashboard, Users, FileText, GraduationCap, Briefcase,
  Bell, Settings, Menu, X, ChevronRight, BookOpen, Shield,
  CreditCard, BarChart3, Wrench, Globe, HeartHandshake,
  DollarSign, AlertTriangle, UserCheck, Award, ClipboardList,
  Building2, TrendingUp, Inbox,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard",    href: "/admin/dashboard",    icon: LayoutDashboard },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Applications", href: "/admin/applications", icon: Inbox },
      { label: "Students",     href: "/admin/students",     icon: Users },
      { label: "Enrollments",  href: "/admin/enrollments",  icon: TrendingUp },
      { label: "At-Risk",      href: "/admin/at-risk",      icon: AlertTriangle },
    ],
  },
  {
    title: "Programs",
    items: [
      { label: "Programs",     href: "/admin/programs",     icon: GraduationCap },
      { label: "Curriculum",   href: "/admin/curriculum",   icon: BookOpen },
      { label: "Courses",      href: "/admin/courses",      icon: ClipboardList },
      { label: "Instructors",  href: "/admin/instructors",  icon: UserCheck },
      { label: "Certificates", href: "/admin/certificates", icon: Award },
    ],
  },
  {
    title: "Funding & Finance",
    items: [
      { label: "WIOA",         href: "/admin/wioa",         icon: HeartHandshake },
      { label: "Funding",      href: "/admin/funding",      icon: DollarSign },
      { label: "Payments",     href: "/admin/payroll",      icon: CreditCard },
      { label: "Grants",       href: "/admin/grants",       icon: Briefcase },
    ],
  },
  {
    title: "Compliance",
    items: [
      { label: "Documents",    href: "/admin/documents",    icon: FileText },
      { label: "Compliance",   href: "/admin/compliance",   icon: Shield },
      { label: "Audit Logs",   href: "/admin/audit-logs",   icon: ClipboardList },
    ],
  },
  {
    title: "Partners",
    items: [
      { label: "Employers",    href: "/admin/employers",    icon: Building2 },
      { label: "Partners",     href: "/admin/partners",     icon: Globe },
      { label: "Jobs",         href: "/admin/jobs",         icon: Briefcase },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Reports",      href: "/admin/reports",      icon: BarChart3 },
      { label: "Notifications",href: "/admin/notifications",icon: Bell },
      { label: "Settings",     href: "/admin/settings",     icon: Settings },
      { label: "Tools",        href: "/admin/advanced-tools",icon: Wrench },
    ],
  },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const renderedSections = useMemo(() => navSections.map((section) => (
    <div key={section.title} className="space-y-1">
      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {section.title}
      </div>
      <div className="space-y-0.5">
        {section.items.map((item) => {
          const active = isItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={[
                "group flex items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-sm transition-colors",
                active
                  ? "border-cyan-400 bg-slate-800 text-white"
                  : "border-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white",
              ].join(" ")}
            >
              <Icon className={["h-4 w-4 shrink-0", active ? "text-cyan-300" : "text-slate-400 group-hover:text-slate-200"].join(" ")} />
              <span className="flex-1 truncate">{item.label}</span>
              <ChevronRight className={["h-3.5 w-3.5 shrink-0", active ? "text-cyan-300" : "text-slate-600 group-hover:text-slate-400"].join(" ")} />
            </Link>
          );
        })}
      </div>
    </div>
  )), [pathname]);

  const sidebarInner = (
    <>
      {/* Brand */}
      <div className="flex h-20 items-center justify-between border-b border-slate-800 px-4 flex-shrink-0">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Elevate Admin
          </div>
          <div className="mt-0.5 text-sm font-semibold text-white">Operations Console</div>
        </div>
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {renderedSections}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 px-4 py-4 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <Globe className="h-3.5 w-3.5" />
          View public site
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger — top-left, inside header height */}
      <button
        type="button"
        aria-label="Open admin navigation"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-5 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — fixed desktop, slide-in mobile */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        {sidebarInner}
      </aside>
    </>
  );
}
