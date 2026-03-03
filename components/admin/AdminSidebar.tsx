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
  Sparkles,
  Workflow,
  ClipboardList,
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

  // ── AI STUDIO ─────────────────────────────────────────────────────
  {
    name: 'AI Studio',
    icon: Sparkles,
    items: [
      { name: 'AI Console', href: '/admin/ai-console', badge: 'AI' },
      { name: 'Course Generator', href: '/admin/course-generator', badge: 'AI' },
      { name: 'Program Generator', href: '/admin/program-generator', badge: 'AI' },
      { name: 'Syllabus Generator', href: '/admin/syllabus-generator', badge: 'AI' },
      { name: 'Video Generator', href: '/admin/video-generator', badge: 'AI' },
      { name: 'Video Manager', href: '/admin/video-manager' },
      { name: 'AI Tutor Logs', href: '/admin/ai-tutor-logs' },
      { name: 'Copilot', href: '/admin/copilot', badge: 'AI' },
      { name: 'Autopilot', href: '/admin/autopilot', badge: 'AI' },
    ],
  },

  // ── USERS ─────────────────────────────────────────────────────────
  {
    name: 'Users & Access',
    icon: Users,
    items: [
      { name: 'All Users', href: '/admin/users' },
      { name: 'Students', href: '/admin/students' },
      { name: 'Instructors', href: '/admin/instructors' },
      { name: 'Applicants', href: '/admin/applicants' },
      { name: 'Applicants Live', href: '/admin/applicants-live' },
      { name: 'Applications', href: '/admin/applications' },
      { name: 'Leads', href: '/admin/leads' },
      { name: 'Waitlist', href: '/admin/waitlist' },
      { name: 'Delegates', href: '/admin/delegates' },
      { name: 'HR', href: '/admin/hr' },
      { name: 'At-Risk Students', href: '/admin/at-risk' },
      { name: 'Intake', href: '/admin/intake' },
      { name: 'Verifications', href: '/admin/verifications' },
    ],
  },

  // ── PROGRAMS & COURSES ────────────────────────────────────────────
  {
    name: 'Programs & Courses',
    icon: GraduationCap,
    items: [
      { name: 'Programs', href: '/admin/programs' },
      { name: 'Courses', href: '/admin/courses' },
      { name: 'Course Builder', href: '/admin/course-builder' },
      { name: 'Course Templates', href: '/admin/course-templates' },
      { name: 'Course Import', href: '/admin/course-import' },
      { name: 'Career Courses', href: '/admin/career-courses' },
      { name: 'Curriculum', href: '/admin/curriculum' },
      { name: 'Modules', href: '/admin/modules' },
      { name: 'Lessons', href: '/admin/lessons' },
      { name: 'External Modules', href: '/admin/external-modules' },
      { name: 'Quiz Builder', href: '/admin/quiz-builder' },
      { name: 'Quizzes', href: '/admin/quizzes' },
      { name: 'Gradebook', href: '/admin/gradebook' },
      { name: 'HVAC Activation', href: '/admin/hvac-activation', badge: 'NEW' },
    ],
  },

  // ── ENROLLMENT & OPERATIONS ───────────────────────────────────────
  {
    name: 'Enrollment & Ops',
    icon: ClipboardList,
    items: [
      { name: 'Enrollments', href: '/admin/enrollments' },
      { name: 'Enrollment Jobs', href: '/admin/enrollment-jobs' },
      { name: 'HSI Enrollments', href: '/admin/hsi-enrollments' },
      { name: 'Partner Enrollments', href: '/admin/partner-enrollments' },
      { name: 'Cohorts', href: '/admin/cohorts' },
      { name: 'Operations', href: '/admin/operations' },
      { name: 'Next Steps', href: '/admin/next-steps' },
    ],
  },

  // ── PARTNERS & EMPLOYERS ──────────────────────────────────────────
  {
    name: 'Partners & Employers',
    icon: Building2,
    items: [
      { name: 'Partners', href: '/admin/partners' },
      { name: 'Partner Inquiries', href: '/admin/partner-inquiries' },
      { name: 'Employers', href: '/admin/employers' },
      { name: 'Employers Playbook', href: '/admin/employers-playbook' },
      { name: 'Program Holders', href: '/admin/program-holders' },
      { name: 'PH Documents', href: '/admin/program-holder-documents' },
      { name: 'PH Acknowledgements', href: '/admin/program-holder-acknowledgements' },
      { name: 'Apprenticeships', href: '/admin/apprenticeships' },
      { name: 'RAPIDS', href: '/admin/rapids' },
      { name: 'JRI', href: '/admin/jri' },
      { name: 'MOU', href: '/admin/mou' },
      { name: 'Shops', href: '/admin/shops' },
      { name: 'Affiliates', href: '/admin/affiliates' },
      { name: 'Jobs Board', href: '/admin/jobs' },
    ],
  },

  // ── CREDENTIALS ───────────────────────────────────────────────────
  {
    name: 'Credentials',
    icon: Award,
    items: [
      { name: 'Certificates', href: '/admin/certificates' },
      { name: 'Certifications', href: '/admin/certifications' },
      { name: 'Completions', href: '/admin/completions' },
      { name: 'Signatures', href: '/admin/signatures' },
      { name: 'License', href: '/admin/license' },
      { name: 'Licenses', href: '/admin/licenses' },
      { name: 'License Requests', href: '/admin/license-requests' },
      { name: 'Licensing', href: '/admin/licensing' },
      { name: 'Proctor Portal', href: '/admin/proctor-portal' },
    ],
  },

  // ── STUDENT SUPPORT ───────────────────────────────────────────────
  {
    name: 'Student Support',
    icon: Briefcase,
    items: [
      { name: 'Progress', href: '/admin/progress' },
      { name: 'External Progress', href: '/admin/external-progress' },
      { name: 'Learner View', href: '/admin/learner' },
      { name: 'Barriers', href: '/admin/barriers' },
      { name: 'Retention', href: '/admin/retention' },
      { name: 'Success', href: '/admin/success' },
      { name: 'Support', href: '/admin/support' },
      { name: 'Transfer Hours', href: '/admin/transfer-hours' },
      { name: 'Hours Export', href: '/admin/hours-export' },
    ],
  },

  // ── CONTENT & MEDIA ───────────────────────────────────────────────
  {
    name: 'Content & Media',
    icon: Video,
    items: [
      { name: 'Media Studio', href: '/admin/media-studio' },
      { name: 'Videos', href: '/admin/videos' },
      { name: 'Documents', href: '/admin/documents' },
      { name: 'Document Center', href: '/admin/document-center' },
      { name: 'Blog', href: '/admin/blog' },
      { name: 'Files', href: '/admin/files' },
      { name: 'Social Media', href: '/admin/social-media' },
      { name: 'Moderation', href: '/admin/moderation' },
      { name: 'Review Queue', href: '/admin/review-queue' },
    ],
  },

  // ── COMMUNICATION ─────────────────────────────────────────────────
  {
    name: 'Communication',
    icon: Mail,
    items: [
      { name: 'CRM', href: '/admin/crm' },
      { name: 'Inbox', href: '/admin/inbox' },
      { name: 'Live Chat', href: '/admin/live-chat' },
      { name: 'Email Marketing', href: '/admin/email-marketing' },
      { name: 'Campaigns', href: '/admin/campaigns' },
      { name: 'Notifications', href: '/admin/notifications' },
      { name: 'Contacts', href: '/admin/contacts' },
      { name: 'Marketing', href: '/admin/marketing' },
    ],
  },

  // ── FUNDING & FINANCE ─────────────────────────────────────────────
  {
    name: 'Funding & Finance',
    icon: DollarSign,
    items: [
      { name: 'Funding', href: '/admin/funding' },
      { name: 'Funding Playbook', href: '/admin/funding-playbook' },
      { name: 'Grants', href: '/admin/grants' },
      { name: 'WIOA', href: '/admin/wioa' },
      { name: 'WOTC', href: '/admin/wotc' },
      { name: 'SAP', href: '/admin/sap' },
      { name: 'Payroll', href: '/admin/payroll' },
      { name: 'Payroll Cards', href: '/admin/payroll-cards' },
      { name: 'Cash Advances', href: '/admin/cash-advances' },
      { name: 'Incentives', href: '/admin/incentives' },
      { name: 'Promo Codes', href: '/admin/promo-codes' },
      { name: 'Tax Filing', href: '/admin/tax-filing' },
      { name: 'Marketplace', href: '/admin/marketplace' },
      { name: 'Store', href: '/admin/store' },
    ],
  },

  // ── COMPLIANCE & REPORTS ──────────────────────────────────────────
  {
    name: 'Compliance & Reports',
    icon: Shield,
    items: [
      { name: 'Analytics', href: '/admin/analytics' },
      { name: 'Performance', href: '/admin/performance-dashboard' },
      { name: 'Reports', href: '/admin/reporting' },
      { name: 'Impact', href: '/admin/impact' },
      { name: 'Outcomes', href: '/admin/outcomes' },
      { name: 'Compliance', href: '/admin/compliance' },
      { name: 'Compliance Audit', href: '/admin/compliance-audit' },
      { name: 'Accreditation', href: '/admin/accreditation' },
      { name: 'FERPA', href: '/admin/ferpa' },
      { name: 'ETPL Alignment', href: '/admin/etpl-alignment' },
      { name: 'Governance', href: '/admin/governance' },
      { name: 'Audit Logs', href: '/admin/audit-logs' },
      { name: 'Activity', href: '/admin/activity' },
    ],
  },

  // ── WORKFLOWS & AUTOMATION ────────────────────────────────────────
  {
    name: 'Workflows',
    icon: Workflow,
    items: [
      { name: 'Workflows', href: '/admin/workflows' },
      { name: 'Automation', href: '/admin/automation' },
      { name: 'Automation QA', href: '/admin/automation-qa' },
      { name: 'Import', href: '/admin/import' },
      { name: 'Portal Map', href: '/admin/portal-map' },
    ],
  },

  // ── SYSTEM ────────────────────────────────────────────────────────
  {
    name: 'System',
    icon: Settings,
    items: [
      { name: 'Settings', href: '/admin/settings' },
      { name: 'Integrations', href: '/admin/integrations' },
      { name: 'API Keys', href: '/admin/api-keys' },
      { name: 'System Health', href: '/admin/system-health' },
      { name: 'System Status', href: '/admin/system-status' },
      { name: 'System Monitor', href: '/admin/system-monitor' },
      { name: 'Site Health', href: '/admin/site-health' },
      { name: 'Monitoring', href: '/admin/monitoring' },
      { name: 'Security', href: '/admin/security' },
      { name: 'Tenants', href: '/admin/tenants' },
      { name: 'Mobile Sync', href: '/admin/mobile-sync' },
    ],
  },

  // ── DEV TOOLS ─────────────────────────────────────────────────────
  {
    name: 'Dev Tools',
    icon: Wrench,
    items: [
      { name: 'Dev Studio', href: '/admin/dev-studio' },
      { name: 'Advanced Tools', href: '/admin/advanced-tools' },
      { name: 'Editor', href: '/admin/editor' },
      { name: 'Data Processor', href: '/admin/data-processor' },
      { name: 'Migrations', href: '/admin/migrations' },
      { name: 'Test Emails', href: '/admin/test-emails' },
      { name: 'Test Payments', href: '/admin/test-payments' },
      { name: 'Docs', href: '/admin/docs' },
      { name: 'Internal Docs', href: '/admin/internal-docs' },
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
