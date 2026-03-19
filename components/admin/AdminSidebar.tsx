'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  FileText,
  Award,
  BarChart3,
  Inbox,
  Shield,
  UserCog,
  Settings,
  Briefcase,
  ChevronDown,
  ChevronRight,
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

// Primary nav: daily operational surfaces only.
// Every item here loads real data and supports a staff task that completes without workarounds.
const PRIMARY_NAV: NavSection[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
  },
  {
    name: 'Students',
    icon: Users,
    href: '/admin/students',
  },
  {
    name: 'Enrollments',
    icon: GraduationCap,
    items: [
      { name: 'Enrollments', href: '/admin/enrollments' },
      { name: 'Cohorts', href: '/admin/cohorts' },
    ],
  },
  {
    name: 'Programs',
    icon: BookOpen,
    items: [
      { name: 'Programs', href: '/admin/programs' },
      { name: 'Completions', href: '/admin/completions' },
    ],
  },
  {
    name: 'Courses',
    icon: BookOpen,
    items: [
      { name: 'Courses', href: '/admin/courses' },
      { name: 'AI Course Builder', href: '/admin/courses/generate' },
      { name: 'Course Builder', href: '/admin/course-builder' },
      { name: 'Curriculum', href: '/admin/curriculum' },
      { name: 'Modules', href: '/admin/modules' },
      { name: 'Lessons', href: '/admin/lessons' },
      { name: 'Quiz Builder', href: '/admin/quiz-builder' },
      { name: 'Gradebook', href: '/admin/gradebook' },
    ],
  },
  {
    name: 'Partners',
    icon: Building2,
    items: [
      { name: 'Partners', href: '/admin/partners' },
      { name: 'Applications', href: '/admin/applications' },
      { name: 'Partner Inquiries', href: '/admin/partner-inquiries' },
      { name: 'CMI — CNA Program', href: '/admin/cmi' },
    ],
  },
  {
    name: 'Documents',
    icon: FileText,
    items: [
      { name: 'Documents', href: '/admin/documents' },
      { name: 'Review Queue', href: '/admin/documents/review' },
    ],
  },
  {
    name: 'Certificates',
    icon: Award,
    items: [
      { name: 'Certificates', href: '/admin/certificates' },
      { name: 'Issue Certificate', href: '/admin/certificates/issue' },
    ],
  },
  {
    name: 'Reports',
    icon: BarChart3,
    items: [
      { name: 'Overview', href: '/admin/reports' },
      { name: 'Enrollment', href: '/admin/reports/enrollment' },
      { name: 'Financial', href: '/admin/reports/financial' },
      { name: 'Partners', href: '/admin/reports/partners' },
      { name: 'Users', href: '/admin/reports/users' },
      { name: 'Leads', href: '/admin/reports/leads' },
      { name: 'Charts', href: '/admin/reports/charts' },
    ],
  },
  {
    name: 'Queues',
    icon: Inbox,
    items: [
      { name: 'Leads', href: '/admin/leads' },
      { name: 'Waitlist', href: '/admin/waitlist' },
      { name: 'Review Queue', href: '/admin/review-queue' },
      { name: 'Applicants', href: '/admin/applicants' },
    ],
  },
];

// Specialist nav: valid surfaces with real data, but infrequent or role-specific.
// Collapsed behind a divider. Auto-expands when current path is inside.
const SPECIALIST_NAV: NavSection[] = [
  {
    name: 'Compliance',
    icon: Shield,
    items: [
      { name: 'WIOA', href: '/admin/wioa' },
      { name: 'WIOA Eligibility', href: '/admin/wioa/eligibility' },
      { name: 'WIOA Documents', href: '/admin/wioa/documents' },
      { name: 'WIOA Reports', href: '/admin/wioa/reports' },
      { name: 'WIOA Verify', href: '/admin/wioa/verify' },
      { name: 'FERPA', href: '/admin/ferpa' },
      { name: 'Accreditation', href: '/admin/accreditation' },
      { name: 'Compliance', href: '/admin/compliance' },
      { name: 'ETPL Alignment', href: '/admin/etpl-alignment' },
      { name: 'Audit Logs', href: '/admin/audit-logs' },
      { name: 'Verifications', href: '/admin/verifications/review' },
    ],
  },
  {
    name: 'Staff',
    icon: UserCog,
    items: [
      { name: 'Users', href: '/admin/users' },
      { name: 'Instructors', href: '/admin/instructors' },
      { name: 'HR', href: '/admin/hr' },
      { name: 'Delegates', href: '/admin/delegates' },
      { name: 'Payroll', href: '/admin/payroll' },
    ],
  },
  {
    name: 'Business Ops',
    icon: Briefcase,
    items: [
      { name: 'Tax Filing', href: '/admin/tax-filing' },
      { name: 'Grants', href: '/admin/grants' },
      { name: 'Funding', href: '/admin/funding' },
      { name: 'JRI', href: '/admin/jri' },
      { name: 'MOU', href: '/admin/mou' },
      { name: 'WOTC', href: '/admin/wotc' },
      { name: 'Program Holders', href: '/admin/program-holders' },
      { name: 'PH Documents', href: '/admin/program-holder-documents' },
      { name: 'Employers', href: '/admin/employers' },
      { name: 'Apprenticeships', href: '/admin/apprenticeships' },
      { name: 'Barber Shop Applications', href: '/admin/barber-shop-applications' },
      { name: 'Shops', href: '/admin/shops' },
      { name: 'Signatures', href: '/admin/signatures' },
      { name: 'License Requests', href: '/admin/license-requests' },
      { name: 'Proctor Portal', href: '/admin/proctor-portal' },
      { name: 'Inbox', href: '/admin/inbox' },
    ],
  },
  {
    name: 'System',
    icon: Settings,
    items: [
      { name: 'Settings', href: '/admin/settings' },
      { name: 'Integrations', href: '/admin/integrations' },
      { name: 'API Keys', href: '/admin/api-keys' },
      { name: 'Security', href: '/admin/security' },
      { name: 'System Health', href: '/admin/system-health' },
      { name: 'System Status', href: '/admin/system-status' },
      { name: 'Site Health', href: '/admin/site-health' },
      { name: 'Tenants', href: '/admin/tenants' },
      { name: 'Enrollment Jobs', href: '/admin/enrollment-jobs' },
      { name: 'Transfer Hours', href: '/admin/transfer-hours' },
      { name: 'Hours Export', href: '/admin/hours-export' },
      { name: 'System Monitor', href: '/admin/system-monitor' },
      { name: 'Automation QA', href: '/admin/automation-qa' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const section of [...PRIMARY_NAV, ...SPECIALIST_NAV]) {
      if (section.items?.some((item) => pathname.startsWith(item.href))) {
        initial.add(section.name);
      }
    }
    return initial;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSpecialist, setShowSpecialist] = useState(false);

  const toggleSection = (name: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const isInSpecialist = SPECIALIST_NAV.some((s) =>
    s.items?.some((item) => pathname.startsWith(item.href))
  );

  const renderSection = (section: NavSection) => {
    if (section.href && !section.items) {
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
  };

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

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {PRIMARY_NAV.map(renderSection)}

        {/* Specialist divider */}
        <div className="pt-3 pb-1">
          <button
            onClick={() => setShowSpecialist((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            <div className="flex-1 h-px bg-gray-800" />
            <span className="flex-shrink-0">
              {showSpecialist || isInSpecialist ? 'Specialist' : 'More'}
            </span>
            {showSpecialist || isInSpecialist ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <div className="flex-1 h-px bg-gray-800" />
          </button>
        </div>

        {(showSpecialist || isInSpecialist) && SPECIALIST_NAV.map(renderSection)}
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
