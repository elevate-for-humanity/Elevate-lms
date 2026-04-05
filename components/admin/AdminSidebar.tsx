"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  X, ChevronDown, Globe, LayoutDashboard, Users, FileText,
  GraduationCap, Briefcase, Bell, Settings, BookOpen, Shield,
  CreditCard, BarChart3, Wrench, HeartHandshake, DollarSign,
  AlertTriangle, UserCheck, Award, ClipboardList, Building2,
  TrendingUp, Inbox, Video, Wand2, Cpu, Layers, FlaskConical,
  Zap, MonitorPlay, PenTool, Database, Activity, Mail,
  MessageSquare, Store, Users2, FileCheck, Scissors, BarChart2,
  Lock, Globe2, Landmark, BookMarked, Clipboard, UserCog,
  Wallet, Hash, Package, Radio, Search, Star, Tv, Mic2,
  FileBadge, FolderOpen, GitBranch, HelpCircle, LayoutGrid,
  Link2, ListChecks, Map, Megaphone, PieChart, RefreshCw,
  ShieldCheck, Sliders, Tag, Target, Timer, Truck, UserPlus,
  Verified, Wifi, Heart, Eye, PlayCircle, Server,
} from "lucide-react";
import { ImageIcon } from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavSection = { title: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard",            href: "/admin/dashboard",            icon: LayoutDashboard },
      { label: "Activity Feed",        href: "/admin/activity",             icon: Radio },
      { label: "Portal Map",           href: "/admin/portal-map",           icon: Map },
      { label: "System Status",        href: "/admin/system-status",        icon: Server },
      { label: "Monitoring",           href: "/admin/monitoring",           icon: Eye },
    ],
  },
  {
    title: "Applications & Intake",
    items: [
      { label: "Applications",         href: "/admin/applications",         icon: Inbox },
      { label: "Applicants",           href: "/admin/applicants",           icon: UserPlus },
      { label: "Live Applicants",      href: "/admin/applicants-live",      icon: Radio },
      { label: "WorkOne Queue",        href: "/admin/workone-queue",        icon: ListChecks },
      { label: "Provider Applications",href: "/admin/provider-applications",icon: Building2 },
      { label: "Barber Applications",  href: "/admin/barber-shop-applications", icon: Scissors },
    ],
  },
  {
    title: "Students & Learners",
    items: [
      { label: "Students",             href: "/admin/students",             icon: Users },
      { label: "Enrollments",          href: "/admin/enrollments",          icon: TrendingUp },
      { label: "At-Risk",              href: "/admin/at-risk",              icon: AlertTriangle },
      { label: "Barriers",             href: "/admin/barriers",             icon: ShieldCheck },
      { label: "Outcomes",             href: "/admin/outcomes",             icon: Star },
      { label: "Submissions",          href: "/admin/submissions",          icon: Clipboard },
      { label: "Verifications",        href: "/admin/verifications",        icon: Verified },
      { label: "External Progress",    href: "/admin/external-progress",    icon: BarChart2 },
    ],
  },
  {
    title: "Programs & Courses",
    items: [
      { label: "Programs",             href: "/admin/programs",             icon: GraduationCap },
      { label: "Courses",              href: "/admin/courses",              icon: ClipboardList },
      { label: "Career Courses",       href: "/admin/career-courses",       icon: BookOpen },
      { label: "Certifications",       href: "/admin/certifications",       icon: Award },
      { label: "Certificates",         href: "/admin/certificates",         icon: FileBadge },
      { label: "Credentials",          href: "/admin/credentials",          icon: FileBadge },
      { label: "Instructors",          href: "/admin/instructors",          icon: UserCheck },
      { label: "Cohorts",              href: "/admin/cohorts",              icon: Users2 },
      { label: "Apprenticeships",      href: "/admin/apprenticeships",      icon: Briefcase },
      { label: "External Courses",     href: "/admin/external-courses",     icon: Globe2 },
      { label: "Videos",               href: "/admin/videos",               icon: PlayCircle },
      { label: "Curriculum",           href: "/admin/curriculum",           icon: BookMarked },
    ],
  },
  {
    title: "Funding & Finance",
    items: [
      { label: "WIOA",                 href: "/admin/wioa",                 icon: HeartHandshake },
      { label: "Funding",              href: "/admin/funding",              icon: DollarSign },
      { label: "Funding Verification", href: "/admin/funding-verification", icon: Verified },
      { label: "Funding Playbook",     href: "/admin/funding-playbook",     icon: BookOpen },
      { label: "Grants",               href: "/admin/grants",               icon: Briefcase },
      { label: "Payroll",              href: "/admin/payroll",              icon: CreditCard },
      { label: "Payroll Cards",        href: "/admin/payroll-cards",        icon: Wallet },
      { label: "Cash Advances",        href: "/admin/cash-advances",        icon: DollarSign },
      { label: "Incentives",           href: "/admin/incentives",           icon: Tag },
      { label: "Promo Codes",          href: "/admin/promo-codes",          icon: Hash },
      { label: "License Requests",     href: "/admin/license-requests",     icon: FileBadge },
      { label: "Licensing",            href: "/admin/licensing",            icon: Lock },
      { label: "Tax Filing",           href: "/admin/tax-filing",           icon: FileText },
    ],
  },
  {
    title: "Compliance & Legal",
    items: [
      { label: "Compliance",           href: "/admin/compliance",           icon: Shield },
      { label: "Documents",            href: "/admin/documents",            icon: FileText },
      { label: "Signatures",           href: "/admin/signatures",           icon: PenTool },
      { label: "Audit Logs",           href: "/admin/audit-logs",           icon: ClipboardList },
      { label: "Accreditation",        href: "/admin/accreditation",        icon: Award },
      { label: "Governance",           href: "/admin/governance",           icon: Landmark },
      { label: "RAPIDS",               href: "/admin/rapids",               icon: Zap },
      { label: "HR",                   href: "/admin/hr",                   icon: Users },
    ],
  },
  {
    title: "Employers & Partners",
    items: [
      { label: "Employers",            href: "/admin/employers",            icon: Building2 },
      { label: "Employers Playbook",   href: "/admin/employers-playbook",   icon: BookOpen },
      { label: "Partners",             href: "/admin/partners",             icon: Globe },
      { label: "Partner Enrollments",  href: "/admin/partner-enrollments",  icon: TrendingUp },
      { label: "Partner Inquiries",    href: "/admin/partner-inquiries",    icon: MessageSquare },
      { label: "Jobs",                 href: "/admin/jobs",                 icon: Briefcase },
      { label: "Affiliates",           href: "/admin/affiliates",           icon: Link2 },
      { label: "Marketplace",          href: "/admin/marketplace",          icon: Store },
      { label: "Store",                href: "/admin/store",                icon: Package },
    ],
  },
  {
    title: "CRM & Marketing",
    items: [
      { label: "CRM",                  href: "/admin/crm",                  icon: Users2 },
      { label: "Email Marketing",      href: "/admin/email-marketing",      icon: Mail },
      { label: "Campaigns",            href: "/admin/campaigns",            icon: Megaphone },
      { label: "Blog",                 href: "/admin/blog",                 icon: FileText },
      { label: "Impact",               href: "/admin/impact",               icon: Heart },
    ],
  },
  {
    title: "Content Tools",
    items: [
      { label: "Course Builder",       href: "/admin/course-builder",       icon: Layers },
      { label: "Video Manager",        href: "/admin/video-manager",        icon: Video },
      { label: "Media Studio",         href: "/admin/media-studio",         icon: ImageIcon },
      { label: "AI Studio",            href: "/admin/ai-studio",            icon: Wand2 },
      { label: "Quiz Builder",         href: "/admin/quiz-builder",         icon: PenTool },
      { label: "Editor",               href: "/admin/editor",               icon: PenTool },
    ],
  },
  {
    title: "Automation & AI",
    items: [
      { label: "AI Console",           href: "/admin/ai-console",           icon: Cpu },
      { label: "Autopilot",            href: "/admin/autopilot",            icon: Zap },
      { label: "Workflows",            href: "/admin/workflows",            icon: Activity },
      { label: "Automation",           href: "/admin/automation",           icon: RefreshCw },
      { label: "Course Generator",     href: "/admin/course-generator",     icon: FlaskConical },
      { label: "Video Generator",      href: "/admin/video-generator",      icon: MonitorPlay },
      { label: "Copilot",              href: "/admin/copilot",              icon: Mic2 },
      { label: "AI Tutor Logs",        href: "/admin/ai-tutor-logs",        icon: BookOpen },
    ],
  },
  {
    title: "Analytics & Reports",
    items: [
      { label: "Analytics",            href: "/admin/analytics",            icon: BarChart3 },
      { label: "Reports",              href: "/admin/reports",              icon: Database },
      { label: "Reporting",            href: "/admin/reporting",            icon: PieChart },
      { label: "System Health",        href: "/admin/system-health",        icon: Wifi },
    ],
  },
  {
    title: "Support & Comms",
    items: [
      { label: "Notifications",        href: "/admin/notifications",        icon: Bell },
      { label: "Support",              href: "/admin/support",              icon: HelpCircle },
      { label: "Moderation",           href: "/admin/moderation",           icon: ShieldCheck },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings",             href: "/admin/settings",             icon: Settings },
      { label: "Users",                href: "/admin/users",                icon: Users },
      { label: "API Keys",             href: "/admin/api-keys",             icon: Lock },
      { label: "Integrations",         href: "/admin/integrations",         icon: GitBranch },
      { label: "Licenses",             href: "/admin/licenses",             icon: FileBadge },
      { label: "Impersonate",          href: "/admin/impersonate",          icon: UserCog },
      { label: "Import",               href: "/admin/import",               icon: FolderOpen },
      { label: "Security",             href: "/admin/security",             icon: Lock },
      { label: "Advanced",             href: "/admin/advanced-tools",       icon: Wrench },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarSection({ section, pathname, onNav }: {
  section: NavSection; pathname: string; onNav: () => void;
}) {
  const hasActive = section.items.some(i => isActive(pathname, i.href));
  // Always start closed so server and client render identical HTML.
  // useEffect opens the active section and Overview after hydration.
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (hasActive || section.title === "Overview") setOpen(true);
  }, [hasActive, section.title]);

  return (
    <div>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors">
        {section.title}
        {/* suppressHydrationWarning: rotation class depends on post-mount state */}
        <ChevronDown suppressHydrationWarning className={`h-3 w-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {/* Always render items in DOM; toggle visibility after mount to avoid hydration mismatch */}
      <div suppressHydrationWarning className={`mt-0.5 mb-2 space-y-0.5 ${mounted && !open ? "hidden" : ""}`}>
        {section.items.map(item => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onNav}
              className={[
                "group flex items-center gap-3 rounded-lg mx-2 px-3 py-2 text-sm font-medium",
                "transition-all duration-150 ease-out",
                active
                  ? "bg-brand-blue-600 text-white shadow-sm shadow-brand-blue-900/40"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white hover:translate-x-0.5",
              ].join(" ")}>
              <Icon className={[
                "h-4 w-4 flex-shrink-0 transition-transform duration-150",
                active ? "text-white" : "text-slate-400 group-hover:text-white group-hover:scale-110",
              ].join(" ")} />
              <span className="truncate">{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export interface AdminSidebarProps { open: boolean; onClose: () => void; }

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside className={[
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 border-r border-slate-800",
        "transform transition-transform duration-200 ease-out lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      ].join(" ")} aria-label="Admin navigation">
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4 flex-shrink-0">
          <Link href="/admin/dashboard" onClick={onClose}>
            <Image src="/images/logo.png" alt="Elevate" width={100} height={30} className="h-7 w-auto object-contain brightness-0 invert" priority />
          </Link>
          <button type="button" aria-label="Close navigation" onClick={onClose}
            className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 space-y-1">
          {NAV.map(section => (
            <SidebarSection key={section.title} section={section} pathname={pathname} onNav={onClose} />
          ))}
        </nav>
        <div className="border-t border-slate-800 px-4 py-3 flex-shrink-0">
          <p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">Elevate for Humanity Admin</p>
        </div>
      </aside>
    </>
  );
}
