import { requireAdmin } from '@/lib/auth';
"use client";
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

import {


  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  DollarSign,
  UserCheck,
  BookOpen,
  Shield,
  Building2,
  ClipboardList,
  BarChart3,
  Settings,
  Mail,
  Share2,
  Sparkles,
  Bell,
  MessageCircle,
  Search,
  ChevronRight,
  CheckCircle2,
  Code,
  ExternalLink,
CheckCircle, } from 'lucide-react';

interface AdminRoute {
  name: string;
  href: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  status: 'active' | 'partial' | 'planned';
  children?: AdminRoute[];
}

const adminRoutes: AdminRoute[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    description: 'Main admin dashboard with overview metrics and quick actions',
    icon: LayoutDashboard,
    status: 'active',
  },
  {
    name: 'Marketing',
    href: '/admin/email-marketing',
    description:
      'Marketing automation, email campaigns, and social media management',
    icon: Sparkles,
    status: 'active',
    children: [
      {
        name: 'Email Marketing',
        href: '/admin/email-marketing',
        description: 'Create and manage email campaigns',
        status: 'active',
      },
      {
        name: 'Social Media',
        href: '/admin/social-media',
        description: 'Social media scheduling and analytics',
        status: 'active',
      },
      {
        name: 'Automation',
        href: '/admin/email-marketing/automation',
        description: 'Marketing automation workflows',
        status: 'active',
      },
    ],
  },
  {
    name: 'Communications',
    href: '/admin/notifications',
    description: 'Push notifications, live chat, and messaging systems',
    icon: MessageCircle,
    status: 'active',
    children: [
      {
        name: 'Push Notifications',
        href: '/admin/notifications',
        description: 'Send push notifications to users',
        status: 'active',
      },
      {
        name: 'Live Chat',
        href: '/admin/live-chat',
        description: 'Live chat support management',
        status: 'active',
      },
    ],
  },
  {
    name: 'HR & Payroll',
    href: '/admin/hr',
    description: 'Employee management, payroll, and HR operations',
    icon: DollarSign,
    status: 'active',
    children: [
      {
        name: 'Employees',
        href: '/admin/hr/employees',
        description: 'Employee directory and management',
        status: 'active',
      },
      {
        name: 'Payroll',
        href: '/admin/hr/payroll',
        description: 'Payroll processing and management',
        status: 'active',
      },
      {
        name: 'Payroll Cards',
        href: '/admin/payroll-cards',
        description: 'Payroll card management',
        status: 'active',
      },
    ],
  },
  {
    name: 'Programs',
    href: '/admin/programs',
    description: 'Program management, courses, and curriculum',
    icon: BookOpen,
    status: 'active',
    children: [
      {
        name: 'All Programs',
        href: '/admin/programs',
        description: 'View and manage all programs',
        status: 'active',
      },
      {
        name: 'Program Builder',
        href: '/admin/programs/builder',
        description: 'Create new programs',
        status: 'active',
      },
      {
        name: 'Courses',
        href: '/admin/courses',
        description: 'Course catalog and management',
        status: 'active',
      },
      {
        name: 'Course Builder',
        href: '/admin/course-builder',
        description: 'Create and edit courses',
        status: 'active',
      },
      {
        name: 'Course Generator',
        href: '/admin/course-generator',
        description: 'AI-powered course creation',
        status: 'active',
      },
      {
        name: 'Course Templates',
        href: '/admin/course-templates',
        description: 'Course templates library',
        status: 'active',
      },
      {
        name: 'Curriculum',
        href: '/admin/curriculum',
        description: 'Curriculum management',
        status: 'active',
      },
      {
        name: 'External Modules',
        href: '/admin/external-modules',
        description: 'Partner course integration',
        status: 'active',
      },
    ],
  },
  {
    name: 'Students',
    href: '/admin/students',
    description: 'Student management, enrollment, and progress tracking',
    icon: GraduationCap,
    status: 'active',
    children: [
      {
        name: 'All Students',
        href: '/admin/students',
        description: 'Student directory and profiles',
        status: 'active',
      },
      {
        name: 'Applications',
        href: '/admin/applications',
        description: 'Student applications',
        status: 'active',
      },
      {
        name: 'Applicants',
        href: '/admin/applicants',
        description: 'Application review',
        status: 'active',
      },
      {
        name: 'Enrollment',
        href: '/admin/enrollment',
        description: 'Enrollment management',
        status: 'active',
      },
      {
        name: 'Enrollments',
        href: '/admin/enrollments',
        description: 'View all enrollments',
        status: 'active',
      },
      {
        name: 'Progress Tracking',
        href: '/admin/progress',
        description: 'Student progress monitoring',
        status: 'active',
      },
      {
        name: 'Completions',
        href: '/admin/completions',
        description: 'Course and program completions',
        status: 'active',
      },
      {
        name: 'Retention',
        href: '/admin/retention',
        description: 'Student retention analytics',
        status: 'active',
      },
    ],
  },
  {
    name: 'Staff Management',
    href: '/admin/instructors',
    description: 'Staff directory, performance, and management',
    icon: UserCheck,
    status: 'active',
    children: [
      {
        name: 'Instructors',
        href: '/admin/instructors',
        description: 'Instructor management',
        status: 'active',
      },
      {
        name: 'Users',
        href: '/admin/users',
        description: 'User account management',
        status: 'active',
      },
    ],
  },
  {
    name: 'Program Holders',
    href: '/admin/program-holders',
    description: 'Partner organizations and MOUs',
    icon: Building2,
    status: 'active',
    children: [
      {
        name: 'All Partners',
        href: '/admin/program-holders',
        description: 'Partner directory',
        status: 'active',
      },
      {
        name: 'Partner Enrollments',
        href: '/admin/partner-enrollments',
        description: 'Partner course enrollments',
        status: 'active',
      },
      {
        name: 'HSI Enrollments',
        href: '/admin/hsi-enrollments',
        description: 'HSI partner enrollments',
        status: 'active',
      },
      {
        name: 'Job Ready Indy',
        href: '/admin/jri',
        description: 'Job Ready Indy partner management',
        status: 'active',
      },
      {
        name: 'MOUs',
        href: '/admin/mou',
        description: 'Memorandum of Understanding',
        status: 'active',
      },
      {
        name: 'Acknowledgements',
        href: '/admin/program-holder-acknowledgements',
        description: 'Partner acknowledgements',
        status: 'active',
      },
    ],
  },
  {
    name: 'Documents',
    href: '/admin/documents',
    description: 'Document management and file storage',
    icon: FileText,
    status: 'active',
    children: [
      {
        name: 'All Documents',
        href: '/admin/documents',
        description: 'Document library',
        status: 'active',
      },
      {
        name: 'Upload',
        href: '/admin/documents/upload',
        description: 'Upload documents',
        status: 'active',
      },
      {
        name: 'Files',
        href: '/admin/files',
        description: 'File manager',
        status: 'active',
      },
      {
        name: 'Signatures',
        href: '/admin/signatures',
        description: 'Digital signatures',
        status: 'active',
      },
    ],
  },
  {
    name: 'Certificates',
    href: '/admin/certificates',
    description: 'Certificate generation and management',
    icon: FileText,
    status: 'active',
    children: [
      {
        name: 'All Certificates',
        href: '/admin/certificates',
        description: 'Certificate management',
        status: 'active',
      },
      {
        name: 'Issue Certificate',
        href: '/admin/certificates/issue',
        description: 'Issue new certificates',
        status: 'active',
      },
      {
        name: 'Bulk Issue',
        href: '/admin/certificates/bulk',
        description: 'Bulk certificate issuance',
        status: 'active',
      },
      {
        name: 'Certifications',
        href: '/admin/certifications',
        description: 'Certification programs',
        status: 'active',
      },
    ],
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    description: 'Analytics, reporting, and insights',
    icon: BarChart3,
    status: 'active',
    children: [
      {
        name: 'Overview',
        href: '/admin/analytics',
        description: 'Analytics dashboard',
        status: 'active',
      },
      {
        name: 'Programs',
        href: '/admin/analytics/programs',
        description: 'Program analytics',
        status: 'active',
      },
      {
        name: 'Retention',
        href: '/admin/retention',
        description: 'Retention metrics',
        status: 'active',
      },
      {
        name: 'Outcomes',
        href: '/admin/outcomes',
        description: 'Student outcomes',
        status: 'active',
      },
      {
        name: 'Impact',
        href: '/admin/impact',
        description: 'Impact reporting',
        status: 'active',
      },
    ],
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    description: 'Generate and view reports',
    icon: ClipboardList,
    status: 'active',
    children: [
      {
        name: 'All Reports',
        href: '/admin/reports',
        description: 'Report library',
        status: 'active',
      },
      {
        name: 'Charts',
        href: '/admin/reports/charts',
        description: 'Visual reports',
        status: 'active',
      },
      {
        name: 'Partners',
        href: '/admin/reports/partners',
        description: 'Partner reports',
        status: 'active',
      },
      {
        name: 'Caseload',
        href: '/admin/reports/caseload',
        description: 'Caseload reports',
        status: 'active',
      },
      {
        name: 'Reporting',
        href: '/admin/reporting',
        description: 'Custom reporting',
        status: 'active',
      },
    ],
  },
  {
    name: 'Compliance',
    href: '/admin/compliance',
    description: 'WIOA compliance and regulatory reporting',
    icon: Shield,
    status: 'active',
    children: [
      {
        name: 'Dashboard',
        href: '/admin/compliance-dashboard',
        description: 'Compliance overview',
        status: 'active',
      },
      {
        name: 'Compliance',
        href: '/admin/compliance',
        description: 'Compliance management',
        status: 'active',
      },
      {
        name: 'Exports',
        href: '/admin/compliance/exports',
        description: 'Data exports',
        status: 'active',
      },
      {
        name: 'Deletions',
        href: '/admin/compliance/deletions',
        description: 'Data deletion requests',
        status: 'active',
      },
      {
        name: 'ETPL Alignment',
        href: '/admin/etpl-alignment',
        description: 'ETPL program alignment',
        status: 'active',
      },
      {
        name: 'Audit Logs',
        href: '/admin/audit-logs',
        description: 'System audit logs',
        status: 'active',
      },
    ],
  },
  {
    name: 'Grants & Funding',
    href: '/admin/grants',
    description: 'Grant management and funding tracking',
    icon: DollarSign,
    status: 'active',
    children: [
      {
        name: 'All Grants',
        href: '/admin/grants',
        description: 'Grant management',
        status: 'active',
      },
      {
        name: 'Submissions',
        href: '/admin/grants/submissions',
        description: 'Grant submissions',
        status: 'active',
      },
      {
        name: 'Revenue',
        href: '/admin/grants/revenue',
        description: 'Revenue tracking',
        status: 'active',
      },
      {
        name: 'Workflow',
        href: '/admin/grants/workflow',
        description: 'Grant workflow',
        status: 'active',
      },
      {
        name: 'Funding',
        href: '/admin/funding',
        description: 'Funding sources',
        status: 'active',
      },
      {
        name: 'Funding Playbook',
        href: '/admin/funding-playbook',
        description: 'Funding strategies',
        status: 'active',
      },
    ],
  },
  {
    name: 'Integrations',
    href: '/admin/integrations',
    description: 'Third-party integrations and APIs',
    icon: Share2,
    status: 'active',
    children: [
      {
        name: 'All Integrations',
        href: '/admin/integrations',
        description: 'Integration management',
        status: 'active',
      },
      {
        name: 'Google Classroom',
        href: '/admin/integrations/google-classroom',
        description: 'Google Classroom sync',
        status: 'active',
      },
      {
        name: 'External Progress',
        href: '/admin/external-progress',
        description: 'External course progress',
        status: 'active',
      },
    ],
  },
  {
    name: 'Advanced Tools',
    href: '/admin/dev-studio',
    description: 'Developer tools and advanced features',
    icon: Code,
    status: 'active',
    children: [
      {
        name: 'Dev Studio',
        href: '/admin/dev-studio',
        description: 'Development tools',
        status: 'active',
      },
      {
        name: 'AI Console',
        href: '/admin/ai-console',
        description: 'AI management console',
        status: 'active',
      },
      {
        name: 'Autopilots',
        href: '/admin/autopilots',
        description: 'Automation management',
        status: 'active',
      },
      {
        name: 'Workflows',
        href: '/admin/workflows',
        description: 'Workflow automation',
        status: 'active',
      },
      {
        name: 'Data Processor',
        href: '/admin/data-processor',
        description: 'Data processing tools',
        status: 'active',
      },
      {
        name: 'Migrations',
        href: '/admin/migrations',
        description: 'Database migrations',
        status: 'active',
      },
    ],
  },
  {
    name: 'System',
    href: '/admin/settings',
    description: 'System settings and configuration',
    icon: Settings,
    status: 'active',
    children: [
      {
        name: 'Settings',
        href: '/admin/settings',
        description: 'System settings',
        status: 'active',
      },
      {
        name: 'Site Health',
        href: '/admin/site-health',
        description: 'Site health monitoring',
        status: 'active',
      },
      {
        name: 'System Health',
        href: '/admin/system-health',
        description: 'System diagnostics',
        status: 'active',
      },
      {
        name: 'Security',
        href: '/admin/security',
        description: 'Security settings',
        status: 'active',
      },
      {
        name: 'Tenants',
        href: '/admin/tenants',
        description: 'Multi-tenant management',
        status: 'active',
      },
    ],
  },
];



export default async function AdminPortalMapPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('pages').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (name: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedSections(newExpanded);
  };

  const filteredRoutes = adminRoutes.filter((route) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchesName = route.name.toLowerCase().includes(query);
    const matchesDescription = route.description.toLowerCase().includes(query);
    const matchesChildren = route.children?.some(
      (child) =>
        child.name.toLowerCase().includes(query) ||
        child.description.toLowerCase().includes(query)
    );
    return matchesName || matchesDescription || matchesChildren;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-2 text-xs font-medium text-brand-green-700 bg-brand-green-100 rounded-full">

      {/* Hero Image */}
            <span className="text-slate-400 flex-shrink-0">•</span>
            Active
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-2 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
            Partial
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-2 text-xs font-medium text-black bg-gray-100 rounded-full">
            Planned
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-2 text-xs font-medium text-black bg-gray-100 rounded-full">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Portal Map" }]} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Admin Portal Map
          </h1>
          <p className="text-lg text-black">
            Complete overview of all admin portal features and routes
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
            <input
              type="text"
              placeholder="Search features, routes, or descriptions..."
              value={searchQuery}
              onChange={(
                e: React.ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >
              ) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-black">
              {adminRoutes.length}
            </div>
            <div className="text-sm text-black">Main Sections</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-black">
              {adminRoutes.reduce(
                (acc, route) => acc + (route.children?.length || 0),
                0
              )}
            </div>
            <div className="text-sm text-black">Total Routes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-brand-green-600">
              {adminRoutes.filter((r) => r.status === 'active').length}
            </div>
            <div className="text-sm text-black">Active Features</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-brand-blue-600">155</div>
            <div className="text-sm text-black">Total Pages</div>
          </div>
        </div>

        {/* Routes List */}
        <div className="space-y-4">
          {filteredRoutes.map((route) => {
            const Icon = route.icon || LayoutDashboard;
            const isExpanded = expandedSections.has(route.name);

            return (
              <div
                key={route.name}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-brand-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-black">
                            {route.name}
                          </h3>
                          {getStatusBadge(route.status)}
                        </div>
                        <p className="text-black mb-3">
                          {route.description}
                        </p>
                        <div className="flex items-center gap-4">
                          <Link
                            href={route.href}
                            className="inline-flex items-center gap-2 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700"
                          >
                            Visit Page
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          {route.children && (
                            <button
                              onClick={() => toggleSection(route.name)}
                              className="inline-flex items-center gap-2 text-sm font-medium text-black hover:text-black"
                            >
                              {isExpanded ? 'Hide' : 'Show'}{' '}
                              {route.children.length} sub-pages
                              <ChevronRight
                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Children */}
                  {route.children && isExpanded && (
                    <div className="mt-6 pl-16 space-y-3 border-l-2 border-gray-200">
                      {route.children.map((child) => (
                        <div key={child.href} className="pl-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-black">
                                  {child.name}
                                </h4>
                                {getStatusBadge(child.status)}
                              </div>
                              <p className="text-sm text-black mb-2">
                                {child.description}
                              </p>
                              <Link
                                href={child.href}
                                className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue-600 hover:text-brand-blue-700"
                              >
                                Visit Page
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-12 bg-brand-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-black mb-2">
            About This Portal
          </h3>
          <p className="text-black mb-4">
            The Elevate for Humanity Admin Portal provides comprehensive tools
            for managing workforce development programs, student enrollment,
            compliance reporting, and partner relationships. All features are
            built with accessibility and ease of use in mind.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-black mb-2">
                Key Features:
              </h4>
              <ul className="space-y-1 text-black">
                <li>• Complete student lifecycle management</li>
                <li>• WIOA compliance and reporting</li>
                <li>• Partner integration and MOUs</li>
                <li>• Certificate generation and tracking</li>
                <li>• Analytics and outcomes reporting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-2">
                Technical Stack:
              </h4>
              <ul className="space-y-1 text-black">
                <li>• Next.js 14 with App Router</li>
                <li>• TypeScript for type safety</li>
                <li>• Supabase for database and auth</li>
                <li>• Tailwind CSS for styling</li>
                <li>• Lucide React for icons</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Reference */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Code Reference
          </h3>
          <div className="space-y-2 text-sm font-mono">
            <div className="text-black">// Admin Layout</div>
            <div>app/admin/layout.tsx</div>
            <div className="text-black mt-4">// Admin Navigation</div>
            <div>components/AdminNav.tsx</div>
            <div className="text-black mt-4">// Admin Header</div>
            <div>components/AdminHeader.tsx</div>
            <div className="text-black mt-4">// Footer Component</div>
            <div>components/layout/Footer.tsx</div>
          </div>
        </div>
      </div>
    </div>
  );
}
