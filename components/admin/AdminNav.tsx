"use client";

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useMemo } from 'react';
import {
  Code,
  BookOpen,
  Zap,
  Image,
  ShoppingCart,
  Home,
  Settings,
  LogOut,
  Users,
  GraduationCap,
  Award,
  Handshake,
  DollarSign,
  Shield,
  FileText,
  Wrench,
  ChevronDown,
} from 'lucide-react';

interface AdminNavProps {
  userRole: string;
  showDevTools?: boolean;
}

interface NavItem {
  href?: string;
  label: string;
  icon: any;
  submenu?: { href: string; label: string }[];
}

// Routes that should be hidden in production
const DEV_TOOL_HREFS = [
  '/admin/dev-studio',
  '/admin/autopilots',
  '/admin/autopilot',
  '/admin/ai-console',
  '/admin/test-emails',
  '/admin/test-funding',
  '/admin/test-payments',
  '/admin/test-webhook',
  '/admin/automation',
];

export default function AdminNav({ userRole, showDevTools = false }: AdminNavProps) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const baseNavItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    {
      label: 'Students',
      icon: Users,
      submenu: [
        { href: '/admin/students', label: 'All Students' },
        { href: '/admin/applicants', label: 'Applicants' },
        { href: '/admin/applicants-live', label: 'Live Applicants' },
        { href: '/admin/applications', label: 'Applications' },
        { href: '/admin/enrollments', label: 'Enrollments' },
        { href: '/admin/hsi-enrollments', label: 'HSI Enrollments' },
        { href: '/admin/partner-enrollments', label: 'Partner Enrollments' },
        { href: '/admin/progress', label: 'Progress' },
        { href: '/admin/completions', label: 'Completions' },
        { href: '/admin/intake', label: 'Intake' },
        { href: '/admin/users/new', label: 'New User' },
      ],
    },
    {
      label: 'Courses',
      icon: BookOpen,
      submenu: [
        { href: '/admin/courses', label: 'All Courses' },
        { href: '/admin/courses/manage', label: 'Manage Courses' },
        { href: '/admin/course-builder', label: 'Course Builder' },
        { href: '/admin/courses/builder', label: 'Visual Builder' },
        { href: '/admin/courses/bulk-operations', label: 'Bulk Operations' },
        { href: '/admin/modules', label: 'Modules' },
        { href: '/admin/lessons', label: 'Lessons' },
        { href: '/admin/quizzes', label: 'Quizzes' },
        { href: '/admin/gradebook', label: 'Gradebook' },
        { href: '/admin/quiz-builder', label: 'Quiz Builder' },
        { href: '/admin/curriculum', label: 'Curriculum' },
      ],
    },
    {
      label: 'Programs',
      icon: Award,
      submenu: [
        { href: '/admin/programs', label: 'All Programs' },
        { href: '/admin/programs/catalog', label: 'Program Catalog' },
        { href: '/admin/programs/builder', label: 'Program Builder' },
        { href: '/admin/program-generator', label: 'Program Generator' },
        { href: '/admin/apprenticeships', label: 'Apprenticeships' },
        { href: '/admin/certifications', label: 'Certifications' },
        { href: '/admin/certificates', label: 'Certificates' },
        { href: '/admin/certificates/issue', label: 'Issue Certificate' },
        { href: '/admin/certificates/bulk', label: 'Bulk Certificates' },
        { href: '/admin/dashboard/etpl', label: 'ETPL Dashboard' },
      ],
    },
    {
      label: 'Partners',
      icon: Handshake,
      submenu: [
        { href: '/admin/partners', label: 'All Partners' },
        { href: '/admin/employers', label: 'Employers' },
        { href: '/admin/delegates', label: 'Delegates' },
        { href: '/admin/partner-inquiries', label: 'Partner Inquiries' },
        { href: '/admin/shops/geocoding', label: 'Shop Geocoding' },
      ],
    },
    {
      label: 'Financial',
      icon: DollarSign,
      submenu: [
        { href: '/admin/funding', label: 'Funding' },
        { href: '/admin/grants', label: 'Grants' },
        { href: '/admin/grants/submissions', label: 'Grant Submissions' },
        { href: '/admin/payroll', label: 'Payroll' },
        { href: '/admin/tax-filing', label: 'Tax Filing' },
        { href: '/admin/incentives', label: 'Incentives' },
      ],
    },
    {
      label: 'Compliance',
      icon: Shield,
      submenu: [
        { href: '/admin/compliance', label: 'Compliance Dashboard' },
        { href: '/admin/compliance-audit', label: 'Compliance Audit' },
        { href: '/admin/compliance/agreements', label: 'Agreements' },
        { href: '/admin/compliance/financial-assurance', label: 'Financial Assurance' },
        { href: '/admin/ferpa', label: 'FERPA' },
        { href: '/admin/sap', label: 'SAP' },
        { href: '/admin/reporting', label: 'Reports' },
        { href: '/admin/outcomes', label: 'Outcomes' },
      ],
    },
    {
      label: 'Reports',
      icon: FileText,
      submenu: [
        { href: '/admin/reports/enrollment', label: 'Enrollment' },
        { href: '/admin/reports/financial', label: 'Financial' },
        { href: '/admin/reports/caseload', label: 'Caseload' },
        { href: '/admin/reports/leads', label: 'Leads' },
        { href: '/admin/reports/partners', label: 'Partners' },
        { href: '/admin/reports/users', label: 'Users' },
        { href: '/admin/reports/charts', label: 'Charts' },
        { href: '/admin/reports/samples', label: 'Sample Reports' },
      ],
    },
    {
      label: 'Content',
      icon: FileText,
      submenu: [
        { href: '/admin/media-studio', label: 'Media Studio' },
        { href: '/admin/videos', label: 'Videos' },
        { href: '/admin/documents', label: 'Documents' },
        { href: '/admin/files', label: 'Files' },
        { href: '/admin/import', label: 'Import Data' },
      ],
    },
    {
      label: 'HR',
      icon: Users,
      submenu: [
        { href: '/admin/hr/payroll', label: 'Payroll' },
        { href: '/admin/hr/leave', label: 'Leave Management' },
        { href: '/admin/hr/time', label: 'Time Tracking' },
      ],
    },
    {
      label: 'System',
      icon: Wrench,
      submenu: [
        { href: '/admin/advanced-tools', label: 'Advanced Tools' },
        { href: '/admin/integrations', label: 'Integrations' },
        { href: '/admin/integrations/salesforce', label: 'Salesforce' },
        { href: '/admin/settings', label: 'Settings' },
        { href: '/admin/audit-logs', label: 'Audit Logs' },
        { href: '/admin/activity', label: 'Activity Log' },
        { href: '/admin/api-keys', label: 'API Keys' },
        { href: '/admin/system-monitor', label: 'System Monitor' },
        { href: '/admin/system-status', label: 'System Status' },
        { href: '/admin/support', label: 'Support' },
      ],
    },
    {
      label: 'AI Studio',
      icon: Zap,
      submenu: [
        { href: '/ai-studio', label: 'AI Studio' },
        { href: '/admin/ai-console', label: 'AI Console' },
        { href: '/admin/course-generator', label: 'Course Generator' },
        { href: '/admin/video-generator', label: 'Video Generator' },
        { href: '/admin/automation', label: 'Automation' },
        { href: '/admin/automation-qa', label: 'Automation QA' },
      ],
    },
    {
      label: 'Analytics',
      icon: Code,
      submenu: [
        { href: '/admin/analytics', label: 'Overview' },
        { href: '/admin/analytics/engagement', label: 'Engagement' },
        { href: '/admin/analytics/learning', label: 'Learning' },
        { href: '/admin/analytics/programs', label: 'Programs' },
      ],
    },
    {
      label: 'CRM',
      icon: Users,
      submenu: [
        { href: '/admin/crm', label: 'CRM Hub' },
        { href: '/admin/crm/contacts', label: 'Contacts' },
        { href: '/admin/crm/campaigns', label: 'Campaigns' },
        { href: '/admin/crm/deals', label: 'Deals' },
        { href: '/admin/crm/leads', label: 'Leads' },
        { href: '/admin/leads/new', label: 'New Lead' },
      ],
    },
    {
      label: 'Marketplace',
      icon: ShoppingCart,
      submenu: [
        { href: '/admin/marketplace/products', label: 'Products' },
        { href: '/admin/marketplace/creators', label: 'Creators' },
        { href: '/admin/marketplace/payouts', label: 'Payouts' },
      ],
    },
    {
      label: 'Store',
      icon: ShoppingCart,
      submenu: [
        { href: '/store', label: 'Store Front' },
        { href: '/admin/licensing', label: 'Licensing' },
        { href: '/store/demo', label: 'Live Demo' },
        { href: '/store/licenses', label: 'Licenses' },
      ],
    },
  ];

  // Filter out dev tools from navigation in production
  const navItems = useMemo(() => {
    if (showDevTools) return baseNavItems;
    
    return baseNavItems.map(item => {
      if (!item.submenu) return item;
      
      const filteredSubmenu = item.submenu.filter(
        sub => !DEV_TOOL_HREFS.includes(sub.href)
      );
      
      // If all submenu items were filtered out, exclude the entire section
      if (filteredSubmenu.length === 0) return null;
      
      return { ...item, submenu: filteredSubmenu };
    }).filter((item): item is NavItem => item !== null);
  }, [showDevTools]);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const isSubmenuActive = (submenu?: { href: string; label: string }[]) => {
    if (!submenu) return false;
    return submenu.some((item) => pathname?.startsWith(item.href));
  };

  return (
    <nav role="navigation" aria-label="Main navigation" className="bg-slate-900 text-white border-b border-slate-700">
      <div className="max-w-full px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/admin" aria-label="Link" className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-white">
              Elevate
            </div>
            <span className="text-sm text-gray-400">Admin Suite</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = item.href
                ? isActive(item.href)
                : isSubmenuActive(item.submenu);

              // Simple link (no dropdown)
              if (item.href && !item.submenu) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      active
                        ? 'bg-brand-blue-600 text-white'
                        : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              }

              // Dropdown menu
              return (
                <div
                  key={index}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      active
                        ? 'bg-brand-blue-600 text-white'
                        : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Dropdown Menu */}
                  {openDropdown === item.label && item.submenu && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-2">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            pathname?.startsWith(subItem.href)
                              ? 'bg-brand-blue-600 text-white'
                              : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {userRole === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
            <Link
              href="/admin/settings"
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <Link
              href="/api/auth/signout"
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
