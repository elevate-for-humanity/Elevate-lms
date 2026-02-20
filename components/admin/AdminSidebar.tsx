'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  BarChart3,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Shield,
  DollarSign,
  Mail,
  Wrench,
  Video,
  Award,
  Briefcase,
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
    href: '/admin',
  },
  {
    name: 'Users & Access',
    icon: Users,
    items: [
      { name: 'All Users', href: '/admin/users' },
      { name: 'Students', href: '/admin/students' },
      { name: 'Instructors', href: '/admin/instructors' },
      { name: 'Applicants', href: '/admin/applicants' },
      { name: 'Leads', href: '/admin/leads' },
      { name: 'Delegates', href: '/admin/delegates' },
      { name: 'HR', href: '/admin/hr' },
      { name: 'At-Risk Students', href: '/admin/at-risk' },
    ],
  },
  {
    name: 'Programs & Courses',
    icon: GraduationCap,
    items: [
      { name: 'Programs', href: '/admin/programs' },
      { name: 'Courses', href: '/admin/courses' },
      { name: 'Course Builder', href: '/admin/course-builder' },
      { name: 'Curriculum', href: '/admin/curriculum' },
      { name: 'Modules', href: '/admin/modules' },
      { name: 'Quiz Builder', href: '/admin/quiz-builder' },
      { name: 'Enrollments', href: '/admin/enrollments' },
      { name: 'HVAC Activation', href: '/admin/hvac-activation', badge: 'NEW' },
    ],
  },
  {
    name: 'Partners & Employers',
    icon: Building2,
    items: [
      { name: 'Partners', href: '/admin/partners' },
      { name: 'Employers', href: '/admin/employers' },
      { name: 'Program Holders', href: '/admin/program-holders' },
      { name: 'Apprenticeships', href: '/admin/apprenticeships' },
      { name: 'JRI', href: '/admin/jri' },
      { name: 'MOU', href: '/admin/mou' },
      { name: 'Shops', href: '/admin/shops' },
    ],
  },
  {
    name: 'Credentials',
    icon: Award,
    items: [
      { name: 'Certificates', href: '/admin/certificates' },
      { name: 'Certifications', href: '/admin/certifications' },
      { name: 'Completions', href: '/admin/completions' },
      { name: 'Signatures', href: '/admin/signatures' },
      { name: 'License', href: '/admin/license' },
    ],
  },
  {
    name: 'Student Support',
    icon: Briefcase,
    items: [
      { name: 'Progress', href: '/admin/progress' },
      { name: 'Barriers', href: '/admin/barriers' },
      { name: 'Retention', href: '/admin/retention' },
      { name: 'Transfer Hours', href: '/admin/transfer-hours' },
      { name: 'Hours Export', href: '/admin/hours-export' },
    ],
  },
  {
    name: 'Content & Media',
    icon: Video,
    items: [
      { name: 'Documents', href: '/admin/documents' },
      { name: 'Document Center', href: '/admin/document-center' },
      { name: 'Videos', href: '/admin/videos' },
      { name: 'Media Studio', href: '/admin/media-studio' },
      { name: 'Blog', href: '/admin/blog' },
      { name: 'Files', href: '/admin/files' },
    ],
  },
  {
    name: 'Communication',
    icon: Mail,
    items: [
      { name: 'Email Marketing', href: '/admin/email-marketing' },
      { name: 'CRM', href: '/admin/crm' },
      { name: 'Inbox', href: '/admin/inbox' },
      { name: 'Notifications', href: '/admin/notifications' },
      { name: 'Contacts', href: '/admin/contacts' },
      { name: 'Campaigns', href: '/admin/campaigns' },
    ],
  },
  {
    name: 'Funding & Finance',
    icon: DollarSign,
    items: [
      { name: 'Funding', href: '/admin/funding' },
      { name: 'Grants', href: '/admin/grants' },
      { name: 'Payroll', href: '/admin/payroll' },
      { name: 'Incentives', href: '/admin/incentives' },
      { name: 'Tax Filing', href: '/admin/tax-filing' },
      { name: 'Marketplace', href: '/admin/marketplace' },
      { name: 'Store', href: '/admin/store' },
    ],
  },
  {
    name: 'Compliance & Reports',
    icon: Shield,
    items: [
      { name: 'Analytics', href: '/admin/analytics' },
      { name: 'Reports', href: '/admin/reporting' },
      { name: 'Compliance', href: '/admin/compliance' },
      { name: 'Accreditation', href: '/admin/accreditation' },
      { name: 'FERPA', href: '/admin/ferpa' },
      { name: 'ETPL Alignment', href: '/admin/etpl-alignment' },
      { name: 'Audit Logs', href: '/admin/audit-logs' },
      { name: 'Outcomes', href: '/admin/outcomes' },
    ],
  },
  {
    name: 'System',
    icon: Settings,
    items: [
      { name: 'Settings', href: '/admin/settings' },
      { name: 'Integrations', href: '/admin/integrations' },
      { name: 'System Health', href: '/admin/system-health' },
      { name: 'Security', href: '/admin/security' },
      { name: 'Tenants', href: '/admin/tenants' },
    ],
  },
  {
    name: 'Dev Tools',
    icon: Wrench,
    items: [
      { name: 'Dev Studio', href: '/admin/dev-studio' },
      { name: 'Autopilot', href: '/admin/autopilot' },
      { name: 'Copilot', href: '/admin/copilot' },
      { name: 'Editor', href: '/admin/editor' },
      { name: 'Migrations', href: '/admin/migrations' },
      { name: 'Data Processor', href: '/admin/data-processor' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    // Auto-open the section containing the current path
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
    <nav className="flex flex-col h-full">
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
