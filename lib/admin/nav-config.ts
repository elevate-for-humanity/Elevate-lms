/**
 * Admin navigation configuration.
 *
 * Canonical source: `platform_settings` row with key `ADMIN_NAV_SECTIONS_JSON`.
 * If that row is absent or invalid, the hardcoded DEFAULT_NAV is used.
 *
 * Shape stored in DB (JSON array):
 *   [{ label: string; href: string; items: { label: string; href: string }[] }]
 *
 * To customise nav without a deploy:
 *   UPDATE platform_settings SET value = '<json>' WHERE key = 'ADMIN_NAV_SECTIONS_JSON';
 */

export interface NavItem {
  label: string;
  href: string;
}

export interface NavSection {
  label: string;
  href: string;
  items: NavItem[];
}

export const DEFAULT_NAV: NavSection[] = [
  {
    label: 'Operations',
    href: '/dashboard',
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'At-Risk Learners', href: '/at-risk' },
      { label: 'Analytics', href: '/analytics' },
      { label: 'Analytics — Engagement', href: '/analytics/engagement' },
      { label: 'Analytics — Learning', href: '/analytics/learning' },
      { label: 'Program Analytics', href: '/analytics/programs' },
      { label: 'Analytics — Revenue', href: '/analytics/revenue' },
      { label: 'Reports', href: '/reports' },
      { label: 'Reports — Enrollment', href: '/reports/enrollment' },
      { label: 'Reports — Financial', href: '/reports/financial' },
      { label: 'Reports — Caseload', href: '/reports/caseload' },
      { label: 'Reports — WIOA', href: '/reports/wioa' },
      { label: 'Notifications', href: '/notifications' },
      { label: 'SMS Delivery', href: '/operations/sms-logs' },
      { label: 'Inbox', href: '/inbox' },
    ],
  },
  {
    label: 'Intelligence',
    href: '/intelligence',
    items: [
      { label: 'Risk Dashboard', href: '/intelligence' },
      { label: 'Completion Forecast', href: '/intelligence/forecast' },
      { label: 'Lizzy', href: '/dashboard' },
      { label: 'Workflows', href: '/studio/workflows' },
      { label: 'System Health', href: '/system-health' },
      { label: 'Snapshots', href: '/snapshots' },
    ],
  },
  {
    label: 'Instructor',
    href: '/instructor/dashboard',
    items: [
      { label: 'Dashboard', href: '/instructor/dashboard' },
      { label: 'Courses', href: '/instructor/courses' },
      { label: 'Students', href: '/instructor/students' },
      { label: 'Gradebook', href: '/instructor/gradebook' },
      { label: 'Submissions', href: '/instructor/submissions' },
      { label: 'Attendance', href: '/instructor/attendance' },
      { label: 'Announcements', href: '/instructor/announcements' },
      { label: 'Analytics', href: '/instructor/analytics' },
      { label: 'Instructor Programs', href: '/instructor/programs' },
      { label: 'Settings', href: '/instructor/settings' },
    ],
  },
  {
    label: 'Staff Portal',
    href: '/staff-portal/dashboard',
    items: [
      { label: 'Dashboard', href: '/staff-portal/dashboard' },
      { label: 'Students', href: '/staff-portal/students' },
      { label: 'Cases', href: '/staff-portal/cases' },
      { label: 'Attendance', href: '/staff-portal/attendance' },
      { label: 'Courses', href: '/staff-portal/courses' },
      { label: 'Campaigns', href: '/staff-portal/campaigns' },
      { label: 'Booth Renters', href: '/staff-portal/booth-renters' },
      { label: 'Training', href: '/staff-portal/training' },
      { label: 'Skills', href: '/staff-portal/skills' },
      { label: 'QA Checklist', href: '/staff-portal/qa-checklist' },
      { label: 'Customer Service', href: '/staff-portal/customer-service' },
    ],
  },
  {
    label: 'Students',
    href: '/students',
    items: [
      { label: 'All Students', href: '/students' },
      { label: 'Applications', href: '/applications' },
      { label: 'Enrollments', href: '/enrollments' },
      { label: 'Enrollment Jobs', href: '/enrollment-jobs' },
      { label: 'Gradebook', href: '/gradebook' },
      { label: 'Submissions', href: '/submissions' },
      { label: 'Verifications', href: '/verifications' },
      { label: 'Certificates', href: '/certificates' },
      { label: 'Testing Center Operations', href: '/testing-center' },
      { label: 'Exam Authorizations', href: '/exam-authorizations' },
      { label: 'Barriers', href: '/barriers' },
      { label: 'Waitlist', href: '/waitlist' },
      { label: 'Transfer Hours', href: '/transfer-hours' },
      { label: 'WorkOne Queue', href: '/workone-queue' },
      { label: 'Referrals', href: '/referrals' },
    ],
  },
  {
    label: 'Programs',
    href: '/programs',
    items: [
      { label: 'Program Administration', href: '/programs' },
      { label: 'Create Program', href: '/programs/new' },
      { label: 'Programs — Catalog', href: '/programs/catalog' },
      { label: 'Studio', href: '/studio' },
      { label: 'All Courses', href: '/courses' },
      { label: 'Career Courses', href: '/career-courses' },
      { label: 'Modules', href: '/modules' },
      { label: 'Videos', href: '/videos' },
      { label: 'Apprenticeships', href: '/apprenticeships' },
      { label: 'Credentials', href: '/credentials' },
      { label: 'Learning Paths', href: '/learning-paths' },
      { label: 'Instructors', href: '/staff' },
      { label: 'Instructors — Performance', href: '/instructors/performance' },
      { label: 'ETPL Dashboard', href: '/dashboard/etpl' },
      { label: 'External Completions', href: '/external-course-completions' },
    ],
  },
  {
    label: 'Funding',
    href: '/funding',
    items: [
      { label: 'Funding Overview', href: '/funding' },
      { label: 'WIOA', href: '/wioa' },
      { label: 'WIOA — Eligibility', href: '/wioa/eligibility' },
      { label: 'WIOA — Documents', href: '/wioa/documents' },
      { label: 'WIOA — Verify', href: '/wioa/verify' },
      { label: 'Grants', href: '/grants' },
      { label: 'Grants — Applications', href: '/grants/applications' },
      { label: 'Grants — Opportunities', href: '/grants/opportunities' },
      { label: 'Grants — Revenue', href: '/grants/revenue' },
      { label: 'Grants — Workflow', href: '/grants/workflow' },
      { label: 'Contracts', href: '/contracts' },
      { label: 'JRI', href: '/jri' },
      { label: 'JRI — Participants', href: '/jri/participants' },
      { label: 'Payout Queue', href: '/payout-queue' },
      { label: 'Payroll Cards', href: '/payroll-cards' },
      { label: 'Incentives', href: '/incentives' },
      { label: 'WOTC', href: '/wotc' },
      { label: 'Funding Verification', href: '/funding-verification' },
    ],
  },
  {
    label: 'Partners',
    href: '/employers',
    items: [
      { label: 'Employers', href: '/employers' },
      { label: 'Employers — Onboarding', href: '/employers/onboarding' },
      { label: 'Partners', href: '/partners' },
      { label: 'Partner Enrollments', href: '/partner-enrollments' },
      { label: 'Program Holders', href: '/program-holders' },
      { label: 'Program Holders — Verification', href: '/program-holders/verification' },
      { label: 'Providers', href: '/providers' },
      { label: 'Provider Applications', href: '/provider-applications' },
      { label: 'Tenants', href: '/tenants' },
      { label: 'Jobs', href: '/jobs' },
      { label: 'Affiliates', href: '/affiliates' },
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Shops', href: '/shops' },
      { label: 'Delegates', href: '/delegates' },
    ],
  },
  {
    label: 'Marketing',
    href: '/crm',
    items: [
      { label: 'CRM', href: '/crm' },
      { label: 'CRM — Leads', href: '/crm/leads' },
      { label: 'CRM — Contacts', href: '/crm/contacts' },
      { label: 'CRM — Deals', href: '/crm/deals' },
      { label: 'CRM — Campaigns', href: '/crm/campaigns' },
      { label: 'CRM — Follow-Ups', href: '/crm/follow-ups' },
      { label: 'Email Marketing', href: '/email-marketing' },
      { label: 'Blog', href: '/blog' },
      { label: 'Content Management', href: '/content' },
      { label: 'Page Builder', href: '/studio' },
      { label: 'Store', href: '/store' },
      { label: 'Live Chat', href: '/live-chat' },
    ],
  },
  {
    label: 'Compliance',
    href: '/compliance',
    items: [
      { label: 'Compliance', href: '/compliance' },
      { label: 'Audit Logs', href: '/audit-logs' },
      { label: 'Accreditation', href: '/accreditation' },
      { label: 'Governance', href: '/governance' },
      { label: 'FERPA', href: '/ferpa' },
      { label: 'FERPA Training', href: '/ferpa/training' },
      { label: 'Documents', href: '/documents' },
      { label: 'Documents — Review', href: '/documents/review' },
      { label: 'Signatures', href: '/signatures' },
      { label: 'MOU', href: '/mou' },
      { label: 'Review Queue', href: '/review-queue' },
      { label: 'HR', href: '/hr' },
      { label: 'HR — Employees', href: '/hr/employees' },
      { label: 'HR — Payroll', href: '/hr/payroll' },
      { label: 'Barber Shop Applications', href: '/barber-shop-applications' },
    ],
  },
  {
    label: 'System',
    href: '/settings',
    items: [
      { label: 'Settings', href: '/settings' },
      { label: 'Staff', href: '/staff' },
      { label: 'Licenses', href: '/licenses' },
      { label: 'API Keys', href: '/api-keys' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Integrations — Stripe', href: '/integrations/stripe' },
      { label: 'Environment Settings', href: '/settings/integrations' },
      { label: 'Integrations — Google Classroom', href: '/integrations/google-classroom' },
      { label: 'Migrations', href: '/migrations' },
      { label: 'System Jobs', href: '/system/jobs' },
      { label: 'System Webhooks', href: '/system/webhooks' },
      { label: 'Files', href: '/files' },
      { label: 'Navigation Settings', href: '/settings/nav' },
      { label: 'Impersonate', href: '/impersonate' },
    ],
  },
];

export function isNavSections(v: unknown): v is NavSection[] {
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.every(
    (s) =>
      s &&
      typeof s === 'object' &&
      typeof s.label === 'string' &&
      typeof s.href === 'string' &&
      s.href.startsWith('/') &&
      Array.isArray(s.items) &&
      s.items.every(
        (i: unknown) =>
          i &&
          typeof i === 'object' &&
          typeof (i as NavItem).label === 'string' &&
          typeof (i as NavItem).href === 'string' &&
          (i as NavItem).href.startsWith('/'),
      ),
  );
}
