'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  DollarSign,
  BookOpen,
  Shield,
  Building2,
  BarChart3,
  Settings,
  Briefcase,
  ClipboardCheck,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

/**
 * Admin Navigation - Enterprise Operations Console
 * 
 * Consolidated navigation structure (~50 sections, not 154)
 * Grouped by operational function, not feature
 * 
 * Hidden from production:
 * - dev-studio, test-* routes (internal tooling)
 * - AI Console renamed to "Decision Support"
 * - Autopilot renamed to "Rule-Based Automations"
 */

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { name: string; href: string }[];
}

const navigation: NavItem[] = [
  { 
    name: 'Overview', 
    href: '/admin/dashboard', 
    icon: LayoutDashboard 
  },
  {
    name: 'Users & Roles',
    icon: Users,
    children: [
      { name: 'All Users', href: '/admin/users' },
      { name: 'Roles & Permissions', href: '/admin/users/roles' },
      { name: 'Activity Log', href: '/admin/activity' },
    ],
  },
  {
    name: 'Students',
    icon: GraduationCap,
    children: [
      { name: 'Student Directory', href: '/admin/students' },
      { name: 'Enrollments', href: '/admin/enrollments' },
      { name: 'Progress Tracking', href: '/admin/progress' },
      { name: 'Completions', href: '/admin/completions' },
      { name: 'Certificates', href: '/admin/certificates' },
    ],
  },
  {
    name: 'Programs & Courses',
    icon: BookOpen,
    children: [
      { name: 'Programs', href: '/admin/programs' },
      { name: 'Courses', href: '/admin/courses' },
      { name: 'Curriculum', href: '/admin/curriculum' },
      { name: 'Modules', href: '/admin/modules' },
    ],
  },
  {
    name: 'Apprenticeships',
    icon: Briefcase,
    children: [
      { name: 'Active Apprenticeships', href: '/admin/apprenticeships' },
      { name: 'RAPIDS Integration', href: '/admin/rapids' },
      { name: 'Hours Tracking', href: '/admin/hours-export' },
    ],
  },
  {
    name: 'Partners & Employers',
    icon: Building2,
    children: [
      { name: 'Program Holders', href: '/admin/program-holders' },
      { name: 'Employers', href: '/admin/employers' },
      { name: 'Partner Enrollments', href: '/admin/partner-enrollments' },
      { name: 'MOUs & Agreements', href: '/admin/mou' },
    ],
  },
  {
    name: 'Funding & Payments',
    icon: DollarSign,
    children: [
      { name: 'Funding Overview', href: '/admin/funding' },
      { name: 'Grants', href: '/admin/grants' },
      { name: 'Payroll', href: '/admin/payroll' },
      { name: 'Incentives', href: '/admin/incentives' },
    ],
  },
  {
    name: 'Compliance',
    icon: Shield,
    children: [
      { name: 'Compliance Dashboard', href: '/admin/compliance-dashboard' },
      { name: 'WIOA Reporting', href: '/admin/wioa' },
      { name: 'Audit Logs', href: '/admin/audit-logs' },
      { name: 'FERPA', href: '/admin/ferpa' },
      { name: 'Verifications', href: '/admin/verifications' },
    ],
  },
  {
    name: 'Reports',
    icon: FileText,
    children: [
      { name: 'Standard Reports', href: '/admin/reports' },
      { name: 'Outcomes', href: '/admin/outcomes' },
      { name: 'Impact Metrics', href: '/admin/impact' },
      { name: 'Data Exports', href: '/admin/data-import' },
    ],
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    children: [
      { name: 'Dashboard', href: '/admin/analytics-dashboard' },
      { name: 'Retention', href: '/admin/retention' },
      { name: 'Performance', href: '/admin/performance-dashboard' },
    ],
  },
  {
    name: 'Automations',
    icon: Zap,
    children: [
      { name: 'Rule-Based Automations', href: '/admin/automation' },
      { name: 'Workflows', href: '/admin/workflows' },
      { name: 'Notifications', href: '/admin/notifications' },
    ],
  },
  {
    name: 'Decision Support',
    icon: ClipboardCheck,
    children: [
      { name: 'Recommendations', href: '/admin/copilot' },
      { name: 'At-Risk Alerts', href: '/admin/at-risk' },
      { name: 'Next Steps', href: '/admin/next-steps' },
    ],
  },
];

// Internal tooling - hidden from production audits
// Only visible to super_admin role
// const internalTools = [
//   { name: 'Dev Studio', href: '/admin/dev-studio' },
//   { name: 'Test Emails', href: '/admin/test-emails' },
//   { name: 'Test Funding', href: '/admin/test-funding' },
//   { name: 'Test Payments', href: '/admin/test-payments' },
//   { name: 'Test Webhook', href: '/admin/test-webhook' },
// ];

export default function AdminNav() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(['Overview']);

  const toggleExpand = (name: string) => {
    setExpanded(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <nav
      role="navigation"
      aria-label="Admin navigation"
      className="w-64 bg-slate-900 text-white min-h-screen flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-white">Elevate</span>
            <span className="text-xs text-slate-400">Operations Console</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            if (item.children) {
              const isExpanded = expanded.includes(item.name);
              const hasActiveChild = item.children.some(child => isActive(child.href));
              
              return (
                <div key={item.name} className="mb-1">
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      hasActiveChild 
                        ? 'bg-slate-800 text-white' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                            isActive(child.href)
                              ? 'bg-brand-blue-600 text-white font-medium'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href!}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href!)
                    ? 'bg-brand-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <Link
          href="/admin/settings"
          className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            isActive('/admin/settings')
              ? 'bg-brand-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          System Settings
        </Link>
      </div>
    </nav>
  );
}
