"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown, Bell, LogOut, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
}

const NAV = [
  {
    label: "Operations",
    href: "/admin/dashboard",
    items: [
      { label: "Dashboard",           href: "/admin/dashboard" },
      { label: "Activity Feed",       href: "/admin/activity" },
      { label: "Analytics",           href: "/admin/analytics" },
      { label: "Reporting",           href: "/admin/reporting" },
      { label: "Reports",             href: "/admin/reports" },
      { label: "Performance",         href: "/admin/performance-dashboard" },
      { label: "Impact",              href: "/admin/impact" },
      { label: "Monitoring",          href: "/admin/monitoring" },
      { label: "System Health",       href: "/admin/system-health" },
      { label: "System Status",       href: "/admin/system-status" },
      { label: "Site Health",         href: "/admin/site-health" },
      { label: "URL Health",          href: "/admin/url-health" },
      { label: "At-Risk",             href: "/admin/at-risk" },
      { label: "Retention",           href: "/admin/retention" },
      { label: "Notifications",       href: "/admin/notifications" },
      { label: "Inbox",               href: "/admin/inbox" },
    ],
  },
  {
    label: "Students",
    href: "/admin/students",
    items: [
      { label: "All Students",        href: "/admin/students" },
      { label: "Applications",        href: "/admin/applications" },
      { label: "Applicants",          href: "/admin/applicants" },
      { label: "Applicants Live",     href: "/admin/applicants-live" },
      { label: "Enrollments",         href: "/admin/enrollments" },
      { label: "Enrollment Jobs",     href: "/admin/enrollment-jobs" },
      { label: "Completions",         href: "/admin/completions" },
      { label: "Outcomes",            href: "/admin/outcomes" },
      { label: "Progress",            href: "/admin/progress" },
      { label: "Gradebook",           href: "/admin/gradebook" },
      { label: "Submissions",         href: "/admin/submissions" },
      { label: "Verifications",       href: "/admin/verifications" },
      { label: "Certificates",        href: "/admin/certificates" },
      { label: "Exam Authorizations", href: "/admin/exam-authorizations" },
      { label: "Barriers",            href: "/admin/barriers" },
      { label: "Next Steps",          href: "/admin/next-steps" },
      { label: "Waitlist",            href: "/admin/waitlist" },
      { label: "Intake",              href: "/admin/intake" },
      { label: "Leads",               href: "/admin/leads" },
      { label: "Contacts",            href: "/admin/contacts" },
      { label: "Transfer Hours",      href: "/admin/transfer-hours" },
      { label: "HSI Enrollments",     href: "/admin/hsi-enrollments" },
      { label: "SAP",                 href: "/admin/sap" },
      { label: "FERPA",               href: "/admin/ferpa" },
      { label: "Impersonate",         href: "/admin/impersonate" },
    ],
  },
  {
    label: "Programs",
    href: "/admin/programs",
    items: [
      { label: "Programs",            href: "/admin/programs" },
      { label: "Courses",             href: "/admin/courses" },
      { label: "Curriculum",          href: "/admin/curriculum" },
      { label: "Modules",             href: "/admin/modules" },
      { label: "Lessons",             href: "/admin/lessons" },
      { label: "Certifications",      href: "/admin/certifications" },
      { label: "Credentials",         href: "/admin/credentials" },
      { label: "Instructors",         href: "/admin/instructors" },
      { label: "Cohorts",             href: "/admin/cohorts" },
      { label: "Apprenticeships",     href: "/admin/apprenticeships" },
      { label: "Career Courses",      href: "/admin/career-courses" },
      { label: "Quizzes",             href: "/admin/quizzes" },
      { label: "External Courses",    href: "/admin/external-courses" },
      { label: "External Modules",    href: "/admin/external-modules" },
      { label: "External Progress",   href: "/admin/external-progress" },
      { label: "External Completions",href: "/admin/external-course-completions" },
      { label: "HVAC Activation",     href: "/admin/hvac-activation" },
      { label: "ETPL Alignment",      href: "/admin/etpl-alignment" },
    ],
  },
  {
    label: "Build",
    href: "/admin/course-builder",
    items: [
      { label: "Course Builder",      href: "/admin/course-builder" },
      { label: "Course Generator",    href: "/admin/course-generator" },
      { label: "Course Templates",    href: "/admin/course-templates" },
      { label: "Course Import",       href: "/admin/course-import" },
      { label: "Program Generator",   href: "/admin/program-generator" },
      { label: "Quiz Builder",        href: "/admin/quiz-builder" },
      { label: "Syllabus Generator",  href: "/admin/syllabus-generator" },
      { label: "Page Builder",        href: "/admin/page-builder" },
      { label: "Editor",              href: "/admin/editor" },
      { label: "Media Studio",        href: "/admin/media-studio" },
      { label: "Video Manager",       href: "/admin/video-manager" },
      { label: "Video Generator",     href: "/admin/video-generator" },
      { label: "Videos",              href: "/admin/videos" },
      { label: "Content Automation",  href: "/admin/content-automation" },
    ],
  },
  {
    label: "AI",
    href: "/admin/ai-console",
    items: [
      { label: "AI Console",          href: "/admin/ai-console" },
      { label: "AI Studio",           href: "/admin/ai-studio" },
      { label: "AI Tutor Logs",       href: "/admin/ai-tutor-logs" },
      { label: "Copilot",             href: "/admin/copilot" },
      { label: "Autopilot",           href: "/admin/autopilot" },
      { label: "Data Processor",      href: "/admin/data-processor" },
      { label: "Automation",          href: "/admin/automation" },
      { label: "Automation QA",       href: "/admin/automation-qa" },
      { label: "Workflows",           href: "/admin/workflows" },
      { label: "Dev Studio",          href: "/admin/dev-studio" },
    ],
  },
  {
    label: "Funding",
    href: "/admin/funding",
    items: [
      { label: "Funding",             href: "/admin/funding" },
      { label: "Grants",              href: "/admin/grants" },
      { label: "WIOA",                href: "/admin/wioa" },
      { label: "JRI",                 href: "/admin/jri" },
      { label: "Incentives",          href: "/admin/incentives" },
      { label: "Cash Advances",       href: "/admin/cash-advances" },
      { label: "Payroll",             href: "/admin/payroll" },
      { label: "Payroll Cards",       href: "/admin/payroll-cards" },
      { label: "Tax Filing",          href: "/admin/tax-filing" },
      { label: "WOTC",                href: "/admin/wotc" },
      { label: "RAPIDS",              href: "/admin/rapids" },
      { label: "Funding Playbook",    href: "/admin/funding-playbook" },
      { label: "Funding Verification",href: "/admin/funding-verification" },
      { label: "Hours Export",        href: "/admin/hours-export" },
    ],
  },
  {
    label: "Partners",
    href: "/admin/employers",
    items: [
      { label: "Employers",           href: "/admin/employers" },
      { label: "Employers Playbook",  href: "/admin/employers-playbook" },
      { label: "Partners",            href: "/admin/partners" },
      { label: "Partner Enrollments", href: "/admin/partner-enrollments" },
      { label: "Partner Inquiries",   href: "/admin/partner-inquiries" },
      { label: "Jobs",                href: "/admin/jobs" },
      { label: "Affiliates",          href: "/admin/affiliates" },
      { label: "Marketplace",         href: "/admin/marketplace" },
      { label: "Providers",           href: "/admin/providers" },
      { label: "Provider Applications",href: "/admin/provider-applications" },
      { label: "Program Holders",     href: "/admin/program-holders" },
      { label: "Delegates",           href: "/admin/delegates" },
      { label: "Shops",               href: "/admin/shops" },
      { label: "Barber Applications", href: "/admin/barber-shop-applications" },
    ],
  },
  {
    label: "Marketing",
    href: "/admin/marketing",
    items: [
      { label: "Marketing",           href: "/admin/marketing" },
      { label: "CRM",                 href: "/admin/crm" },
      { label: "Campaigns",           href: "/admin/campaigns" },
      { label: "Email Marketing",     href: "/admin/email-marketing" },
      { label: "Blog",                href: "/admin/blog" },
      { label: "Social Media",        href: "/admin/social-media" },
      { label: "Promo Codes",         href: "/admin/promo-codes" },
      { label: "Store",               href: "/admin/store" },
      { label: "Live Chat",           href: "/admin/live-chat" },
      { label: "Support",             href: "/admin/support" },
    ],
  },
  {
    label: "Compliance",
    href: "/admin/compliance",
    items: [
      { label: "Compliance",          href: "/admin/compliance" },
      { label: "Compliance Audit",    href: "/admin/compliance-audit" },
      { label: "Accreditation",       href: "/admin/accreditation" },
      { label: "Governance",          href: "/admin/governance" },
      { label: "Audit Logs",          href: "/admin/audit-logs" },
      { label: "Documents",           href: "/admin/documents" },
      { label: "Document Center",     href: "/admin/document-center" },
      { label: "Signatures",          href: "/admin/signatures" },
      { label: "MOU",                 href: "/admin/mou" },
      { label: "Security",            href: "/admin/security" },
      { label: "HR",                  href: "/admin/hr" },
      { label: "Moderation",          href: "/admin/moderation" },
      { label: "Review Queue",        href: "/admin/review-queue" },
    ],
  },
  {
    label: "System",
    href: "/admin/settings",
    items: [
      { label: "Settings",            href: "/admin/settings" },
      { label: "Users",               href: "/admin/users" },
      { label: "Tenants",             href: "/admin/tenants" },
      { label: "License",             href: "/admin/license" },
      { label: "Licenses",            href: "/admin/licenses" },
      { label: "Licensing",           href: "/admin/licensing" },
      { label: "License Requests",    href: "/admin/license-requests" },
      { label: "Features",            href: "/admin/features" },
      { label: "API Keys",            href: "/admin/api-keys" },
      { label: "Integrations",        href: "/admin/integrations" },
      { label: "Migrations",          href: "/admin/migrations" },
      { label: "Import",              href: "/admin/import" },
      { label: "Mobile Sync",         href: "/admin/mobile-sync" },
      { label: "Files",               href: "/admin/files" },
      { label: "Docs",                href: "/admin/docs" },
      { label: "Internal Docs",       href: "/admin/internal-docs" },
      { label: "Portal Map",          href: "/admin/portal-map" },
      { label: "Advanced Tools",      href: "/admin/advanced-tools" },
      { label: "Testing",             href: "/admin/testing" },
      { label: "Test Emails",         href: "/admin/test-emails" },
      { label: "Test Payments",       href: "/admin/test-payments" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function isSectionActive(pathname: string, section: typeof NAV[0]) {
  return section.items.some(item => isActive(pathname, item.href));
}

export default function AdminNav({ userName = "Admin", notifs = [] }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const unread = notifs.filter(n => n.unread).length;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenDropdown(null);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpenDropdown(null); setNotifOpen(false); setMobileOpen(false); }
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  useEffect(() => {
    setMobileOpen(false); setOpenDropdown(null); setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) { router.push(`/admin/students?search=${encodeURIComponent(search.trim())}`); setSearch(""); }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200">
        <div className="h-full flex items-center gap-2 px-4 sm:px-6">

          <Link href="/admin/dashboard" className="flex items-center gap-2 flex-shrink-0 mr-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">E</span>
            </div>
            <span className="font-bold text-slate-900 text-sm hidden sm:block">
              Elevate <span className="text-slate-400 font-normal">Admin</span>
            </span>
          </Link>

          <nav ref={navRef} className="hidden lg:flex items-center gap-0 flex-1 overflow-x-auto" style={{scrollbarWidth:'none'}}>
            {NAV.map(section => {
              const active = isSectionActive(pathname, section);
              const open = openDropdown === section.label;
              return (
                <div key={section.label} className="relative flex-shrink-0">
                  <button
                    onClick={() => setOpenDropdown(open ? null : section.label)}
                    className={`flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${active ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"}`}
                  >
                    {section.label}
                    <ChevronDown className={`w-2.5 h-2.5 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 max-h-[70vh] overflow-y-auto">
                      {section.items.map(item => (
                        <Link key={item.href} href={item.href}
                          className={`block px-4 py-2 text-sm transition-colors ${isActive(pathname, item.href) ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"}`}>
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
            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…"
                className="w-28 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
            </form>

            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(v => !v)} aria-label="Notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                <Bell className="w-4 h-4" />
                {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    <Link href="/admin/notifications" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all</Link>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifs.length === 0
                      ? <div className="px-4 py-8 text-center text-sm text-slate-400">All caught up</div>
                      : notifs.map(n => (
                        <Link key={n.id} href={n.href} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${n.unread ? "font-semibold text-slate-900" : "text-slate-500"}`}>{n.title}</p>
                            <p className="mt-0.5 text-xs text-slate-400">{n.time}</p>
                          </div>
                          {n.unread && <span className="mt-2 w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />}
                        </Link>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link href="/admin/settings" className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">{userName}</Link>
              <button onClick={signOut} aria-label="Sign out"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <button onClick={() => setMobileOpen(v => !v)} aria-label="Toggle menu"
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div
        className="fixed top-16 right-0 bottom-0 w-[85vw] max-w-sm bg-white z-50 lg:hidden transform transition-transform duration-300 overflow-y-auto shadow-2xl"
        style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="p-4 space-y-1">
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 mb-4">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…"
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
          </form>

          {NAV.map(section => {
            const active = isSectionActive(pathname, section);
            const expanded = mobileExpanded === section.label;
            return (
              <div key={section.label} className="border-b border-slate-100 pb-1 mb-1 last:border-0">
                <button onClick={() => setMobileExpanded(expanded ? null : section.label)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold transition-colors ${active ? "text-blue-600 bg-blue-50" : "text-slate-900 hover:bg-slate-50"}`}>
                  {section.label}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
                {expanded && (
                  <div className="ml-3 mt-1 mb-2 space-y-0.5">
                    {section.items.map(item => (
                      <Link key={item.href} href={item.href}
                        className={`block px-3 py-2 rounded-xl text-sm transition-colors ${isActive(pathname, item.href) ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4 space-y-2 border-t border-slate-100">
            <Link href="/admin/settings" className="block px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors">Settings</Link>
            <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-rose-600 hover:bg-rose-50 transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
