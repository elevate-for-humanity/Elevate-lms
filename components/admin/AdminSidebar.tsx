'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  Shield,
  Mail,
  Wrench,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  X,
  Menu,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  badge?: string;
}

interface NavSection {
  name: string;
  icon: React.ElementType;
  href?: string;
  items?: NavItem[];
}

const NAV: NavSection[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
  },

  // ── OPERATIONS ────────────────────────────────────────────────────
  {
    name: 'Operations',
    icon: ClipboardList,
    items: [
      { name: 'Students',       href: '/admin/students' },
      { name: 'Enrollments',    href: '/admin/enrollments' },
      { name: 'Applications',   href: '/admin/applications' },
      { name: 'Applicants',     href: '/admin/applicants' },
      { name: 'Leads',          href: '/admin/leads' },
      { name: 'Intake',         href: '/admin/intake' },
      { name: 'At-Risk',        href: '/admin/at-risk' },
      { name: 'Waitlist',       href: '/admin/waitlist' },
      { name: 'Cohorts',        href: '/admin/cohorts' },
      { name: 'Completions',    href: '/admin/completions' },
      { name: 'Transfer Hours', href: '/admin/transfer-hours' },
      { name: 'Cash Advances',  href: '/admin/cash-advances' },
      { name: 'Payroll Cards',  href: '/admin/payroll-cards' },
    ],
  },

  // ── PROGRAMS ──────────────────────────────────────────────────────
  {
    name: 'Programs',
    icon: GraduationCap,
    items: [
      { name: 'All Programs',      href: '/admin/programs' },
      { name: 'Courses',           href: '/admin/courses' },
      { name: 'Modules',           href: '/admin/modules' },
      { name: 'Lessons',           href: '/admin/lessons' },
      { name: 'Gradebook',         href: '/admin/gradebook' },
      { name: 'Certificates',      href: '/admin/certificates' },
      { name: 'External Modules',  href: '/admin/external-modules' },
      { name: 'Course Import',     href: '/admin/course-import' },
      { name: 'Syllabus Generator',href: '/admin/syllabus-generator', badge: 'AI' },
      { name: 'HVAC Activation',   href: '/admin/hvac-activation', badge: 'NEW' },
      { name: 'Apprenticeships',   href: '/admin/apprenticeships' },
      { name: 'RAPIDS',            href: '/admin/rapids' },
      { name: 'ETPL',              href: '/admin/etpl-alignment' },
    ],
  },

  // ── PARTNERS ──────────────────────────────────────────────────────
  {
    name: 'Partners',
    icon: Building2,
    items: [
      { name: 'All Partners',         href: '/admin/partners' },
      { name: 'Program Holders',      href: '/admin/program-holders' },
      { name: 'Employers',            href: '/admin/employers' },
      { name: 'Partner Inquiries',    href: '/admin/partner-inquiries' },
      { name: 'Barber Applications',  href: '/admin/barber-shop-applications' },
      { name: 'Shops',                href: '/admin/shops' },
      { name: 'MOU',                  href: '/admin/mou' },
      { name: 'Signatures',           href: '/admin/signatures' },
      { name: 'Licenses',             href: '/admin/licenses' },
      { name: 'Jobs Board',           href: '/admin/jobs' },
      { name: 'WOTC',                 href: '/admin/wotc' },
      { name: 'Marketplace',          href: '/admin/marketplace' },
    ],
  },

  // ── COMPLIANCE ────────────────────────────────────────────────────
  {
    name: 'Compliance',
    icon: Shield,
    items: [
      { name: 'WIOA',           href: '/admin/wioa' },
      { name: 'Documents',      href: '/admin/documents' },
      { name: 'Doc Review',     href: '/admin/documents/review' },
      { name: 'Proctor Portal', href: '/admin/proctor-portal' },
      { name: 'Audit Logs',     href: '/admin/audit-logs' },
      { name: 'Reports',        href: '/admin/reports' },
      { name: 'Accreditation',  href: '/admin/accreditation' },
      { name: 'Grants',         href: '/admin/grants' },
      { name: 'FERPA',          href: '/admin/ferpa' },
      { name: 'SAP',            href: '/admin/sap' },
      { name: 'JRI',            href: '/admin/jri' },
      { name: 'Compliance',     href: '/admin/compliance' },
    ],
  },

  // ── COMMUNICATIONS ────────────────────────────────────────────────
  {
    name: 'Communications',
    icon: Mail,
    items: [
      { name: 'Notifications',    href: '/admin/notifications' },
      { name: 'Email Marketing',  href: '/admin/email-marketing' },
      { name: 'CRM — Leads',      href: '/admin/crm/leads' },
      { name: 'CRM — Contacts',   href: '/admin/crm/contacts' },
      { name: 'CRM — Appointments', href: '/admin/crm/appointments' },
      { name: 'Inbox',            href: '/admin/inbox' },
      { name: 'Live Chat',        href: '/admin/live-chat' },
      { name: 'Blog',             href: '/admin/blog' },
      { name: 'Test Emails',      href: '/admin/test-emails' },
    ],
  },

  // ── SYSTEM ────────────────────────────────────────────────────────
  {
    name: 'System',
    icon: Wrench,
    items: [
      { name: 'Settings',       href: '/admin/settings' },
      { name: 'Users & Roles',  href: '/admin/users' },
      { name: 'Integrations',   href: '/admin/integrations' },
      { name: 'System Status',  href: '/admin/system-status' },
      { name: 'Monitoring',     href: '/admin/monitoring' },
      { name: 'Automation',     href: '/admin/automation' },
      { name: 'Workflows',      href: '/admin/workflows' },
      { name: 'Migrations',     href: '/admin/migrations' },
      { name: 'AI Console',     href: '/admin/ai-console', badge: 'AI' },
      { name: 'Video Generator',href: '/admin/video-generator', badge: 'AI' },
      { name: 'Dev Studio',     href: '/admin/dev-studio' },
      { name: 'Test Payments',  href: '/admin/test-payments' },
      { name: 'Activity',       href: '/admin/activity' },
    ],
  },

  // ── LEGACY (kept for transition, remove after 30 days) ────────────
  // These sections are intentionally omitted from the new nav.
  // Legacy routes redirect via lib/admin-redirects.ts.
  // Placeholder sections removed:
  //   AI Studio (course-generator, program-generator → /admin/programs/new)
  //   Users & Access (applicants-live, learner → redirected)
  //   Programs & Courses (course-builder, curriculum, quiz-builder → redirected)
  //   Credentials (certifications, license, licensing → redirected)
  //   Student Support (progress, retention, success → redirected)
  //   Content & Media (document-center, files, review-queue → redirected)
  //   Governance (static docs, hidden)
  //   Affiliates (shell, hidden)
  //   Social Media (zero DB, hidden)
  //   Reports/Samples (deleted)
  //   Staff (deleted)
  //   Advanced Tools (deleted)
];

// Legacy nav sections removed — routes redirect via lib/admin-redirects.ts

export default function AdminSidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const section of NAV) {
      if (section.items?.some((item) => pathname.startsWith(item.href))) {
        initial.add(section.name);
      }
    }
    return initial;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSection = (name: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const sidebarContent = (
    <nav className="flex flex-col h-full" aria-label="Admin sidebar">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Elevate Admin</div>
            <div className="text-gray-500 text-xs">Management Console</div>
          </div>
        </Link>
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map((section) => {
          if (section.href && !section.items) {
            // Direct link (Dashboard)
            return (
              <Link
                key={section.name}
                href={section.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive(section.href)
                    ? 'bg-brand-blue-600/20 text-brand-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <section.icon className="w-4 h-4 flex-shrink-0" />
                <span>{section.name}</span>
              </Link>
            );
          }

          const isOpen = openSections.has(section.name);
          const hasActiveChild = section.items?.some((item) => isActive(item.href));

          return (
            <div key={section.name}>
              <button
                onClick={() => toggleSection(section.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  hasActiveChild
                    ? 'text-brand-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <section.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{section.name}</span>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>

              {isOpen && section.items && (
                <div className="ml-4 pl-3 border-l border-gray-800 mt-0.5 space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                        isActive(item.href)
                          ? 'bg-brand-blue-600/20 text-brand-blue-400'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                      }`}
                    >
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-blue-600 text-white font-medium">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800">
        <Link
          href="/"
          className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
        >
          &larr; Back to site
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 rounded-lg text-gray-400 hover:text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 bg-gray-900 h-full shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-gray-900 border-r border-gray-800 z-40">
        {sidebarContent}
      </aside>
    </>
  );
}
