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
    href: '/admin/dashboard',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'At-Risk Learners', href: '/admin/at-risk' },
      { label: 'Analytics', href: '/admin/analytics' },
      { label: 'Analytics — Engagement', href: '/admin/analytics/engagement' },
      { label: 'Analytics — Learning', href: '/admin/analytics/learning' },
      { label: 'Analytics — Programs', href: '/admin/analytics/programs' },
      { label: 'Analytics — Revenue', href: '/admin/analytics/revenue' },
      { label: 'Reports', href: '/admin/reports' },
      { label: 'Reports — Enrollment', href: '/admin/reports/enrollment' },
      { label: 'Reports — Financial', href: '/admin/reports/financial' },
      { label: 'Reports — Caseload', href: '/admin/reports/caseload' },
      { label: 'Reports — WIOA', href: '/admin/reports/wioa' },
      { label: 'Notifications', href: '/admin/notifications' },
      { label: 'Inbox', href: '/admin/inbox' },
    ],
  },
  {
    label: 'Intelligence',
    href: '/admin/intelligence',
    items: [
      { label: 'Risk Dashboard', href: '/admin/intelligence' },
      { label: 'Completion Forecast', href: '/admin/intelligence/forecast' },
      { label: 'Lizzy', href: '/admin/dashboard' },
      { label: 'Workflows', href: '/admin/workflows' },
      { label: 'Workflows', href: '/admin/workflows' },
      { label: 'System Health', href: '/admin/system-health' },
      { label: 'Snapshots', href: '/admin/snapshots' },
    ],
  },
  {
    label: 'Instructor',
    href: '/admin/instructor/dashboard',
    items: [
      { label: 'Dashboard', href: '/admin/instructor/dashboard' },
      { label: 'Courses', href: '/admin/instructor/courses' },
      { label: 'Students', href: '/admin/instructor/students' },
      { label: 'Gradebook', href: '/admin/instructor/gradebook' },
      { label: 'Submissions', href: '/admin/instructor/submissions' },
      { label: 'Attendance', href: '/admin/instructor/attendance' },
      { label: 'Announcements', href: '/admin/instructor/announcements' },
      { label: 'Analytics', href: '/admin/instructor/analytics' },
      { label: 'Programs', href: '/admin/instructor/programs' },
      { label: 'Settings', href: '/admin/instructor/settings' },
    ],
  },
  {
    label: 'Staff Portal',
    href: '/admin/staff-portal/dashboard',
    items: [
      { label: 'Dashboard', href: '/admin/staff-portal/dashboard' },
      { label: 'Students', href: '/admin/staff-portal/students' },
      { label: 'Cases', href: '/admin/staff-portal/cases' },
      { label: 'Attendance', href: '/admin/staff-portal/attendance' },
      { label: 'Courses', href: '/admin/staff-portal/courses' },
      { label: 'Campaigns', href: '/admin/staff-portal/campaigns' },
      { label: 'Booth Renters', href: '/admin/staff-portal/booth-renters' },
      { label: 'Training', href: '/admin/staff-portal/training' },
      { label: 'Skills', href: '/admin/staff-portal/skills' },
      { label: 'QA Checklist', href: '/admin/staff-portal/qa-checklist' },
      { label: 'Customer Service', href: '/admin/staff-portal/customer-service' },
    ],
  },
  {
    label: 'Students',
    href: '/admin/students',
    items: [
      { label: 'All Students', href: '/admin/students' },
      { label: 'Applications', href: '/admin/applications' },
      { label: 'Enrollments', href: '/admin/enrollments' },
      { label: 'Enrollment Jobs', href: '/admin/enrollment-jobs' },
      { label: 'Gradebook', href: '/admin/gradebook' },
      { label: 'Submissions', href: '/admin/submissions' },
      { label: 'Verifications', href: '/admin/verifications' },
      { label: 'Certificates', href: '/admin/certificates' },
      { label: 'Testing Center', href: '/admin/testing-center' },
      { label: 'Exam Authorizations', href: '/admin/exam-authorizations' },
      { label: 'Barriers', href: '/admin/barriers' },
      { label: 'Waitlist', href: '/admin/waitlist' },
      { label: 'Transfer Hours', href: '/admin/transfer-hours' },
      { label: 'WorkOne Queue', href: '/admin/workone-queue' },
      { label: 'Referrals', href: '/admin/referrals' },
    ],
  },
  {
    label: 'Programs',
    href: '/admin/programs',
    items: [
      { label: 'All Programs', href: '/admin/programs' },
      { label: 'Create Program', href: '/admin/programs/new' },
      { label: 'Programs — Catalog', href: '/admin/programs/catalog' },
      { label: 'Studio', href: '/admin/studio' },
      { label: 'All Courses', href: '/admin/courses' },
      { label: 'Career Courses', href: '/admin/career-courses' },
      { label: 'Modules', href: '/admin/modules' },
      { label: 'Videos', href: '/admin/videos' },
      { label: 'Apprenticeships', href: '/admin/apprenticeships' },
      { label: 'Credentials', href: '/admin/credentials' },
      { label: 'Learning Paths', href: '/admin/learning-paths' },
      { label: 'Instructors', href: '/admin/instructors' },
      { label: 'Instructors — Performance', href: '/admin/instructors/performance' },
      { label: 'ETPL Dashboard', href: '/admin/dashboard/etpl' },
      { label: 'External Completions', href: '/admin/external-course-completions' },
    ],
  },
  {
    label: 'Funding',
    href: '/admin/funding',
    items: [
      { label: 'Funding Overview', href: '/admin/funding' },
      { label: 'WIOA', href: '/admin/wioa' },
      { label: 'WIOA — Eligibility', href: '/admin/wioa/eligibility' },
      { label: 'WIOA — Documents', href: '/admin/wioa/documents' },
      { label: 'WIOA — Verify', href: '/admin/wioa/verify' },
      { label: 'Grants', href: '/admin/grants' },
      { label: 'Grants — Applications', href: '/admin/grants/applications' },
      { label: 'Grants — Opportunities', href: '/admin/grants/opportunities' },
      { label: 'Grants — Revenue', href: '/admin/grants/revenue' },
      { label: 'Grants — Workflow', href: '/admin/grants/workflow' },
      { label: 'Contracts', href: '/admin/contracts' },
      { label: 'JRI', href: '/admin/jri' },
      { label: 'JRI — Participants', href: '/admin/jri/participants' },

      { label: 'Payout Queue', href: '/admin/payout-queue' },
      { label: 'Payroll Cards', href: '/admin/payroll-cards' },
      { label: 'Incentives', href: '/admin/incentives' },
      { label: 'WOTC', href: '/admin/wotc' },
      { label: 'Funding Verification', href: '/admin/funding-verification' },
    ],
  },
  {
    label: 'Partners',
    href: '/admin/employers',
    items: [
      { label: 'Employers', href: '/admin/employers' },
      { label: 'Employers — Onboarding', href: '/admin/employers/onboarding' },
      { label: 'Partners', href: '/admin/partners' },
      { label: 'Partner Enrollments', href: '/admin/partner-enrollments' },
      { label: 'Program Holders', href: '/admin/program-holders' },
      { label: 'Program Holders — Verification', href: '/admin/program-holders/verification' },
      { label: 'Providers', href: '/admin/providers' },
      { label: 'Provider Applications', href: '/admin/provider-applications' },
      { label: 'Tenants', href: '/admin/tenants' },
      { label: 'Jobs', href: '/admin/jobs' },
      { label: 'Affiliates', href: '/admin/affiliates' },
      { label: 'Marketplace', href: '/admin/marketplace' },
      { label: 'Shops', href: '/admin/shops' },
      { label: 'Delegates', href: '/admin/delegates' },
    ],
  },
  {
    label: 'Marketing',
    href: '/admin/crm',
    items: [
      { label: 'CRM', href: '/admin/crm' },
      { label: 'CRM — Leads', href: '/admin/crm/leads' },
      { label: 'CRM — Contacts', href: '/admin/crm/contacts' },
      { label: 'CRM — Deals', href: '/admin/crm/deals' },
      { label: 'CRM — Campaigns', href: '/admin/crm/campaigns' },
      { label: 'CRM — Follow-Ups', href: '/admin/crm/follow-ups' },
      { label: 'Email Marketing', href: '/admin/email-marketing' },
      { label: 'Blog', href: '/admin/blog' },
      { label: 'Content Management', href: '/admin/content' },
      { label: 'Page Builder', href: '/admin/page-builder' },
      { label: 'Store', href: '/admin/store' },
      { label: 'Live Chat', href: '/admin/live-chat' },
    ],
  },
  {
    label: 'Compliance',
    href: '/admin/compliance',
    items: [
      { label: 'Compliance', href: '/admin/compliance' },
      { label: 'Audit Logs', href: '/admin/audit-logs' },
      { label: 'Accreditation', href: '/admin/accreditation' },
      { label: 'Governance', href: '/admin/governance' },
      { label: 'FERPA', href: '/admin/ferpa' },
      { label: 'FERPA Training', href: '/admin/ferpa/training' },
      { label: 'Documents', href: '/admin/documents' },
      { label: 'Documents — Review', href: '/admin/documents/review' },
      { label: 'Signatures', href: '/admin/signatures' },
      { label: 'MOU', href: '/admin/mou' },
      { label: 'Review Queue', href: '/admin/review-queue' },
      { label: 'HR', href: '/admin/hr' },
      { label: 'HR — Employees', href: '/admin/hr/employees' },
      { label: 'HR — Payroll', href: '/admin/hr/payroll' },
      { label: 'Barber Shop Applications', href: '/admin/barber-shop-applications' },
    ],
  },
  {
    label: 'System',
    href: '/admin/settings',
    items: [
      { label: 'Settings', href: '/admin/settings' },
      { label: 'Staff', href: '/admin/staff' },
      { label: 'Licenses', href: '/admin/licenses' },
      { label: 'API Keys', href: '/admin/api-keys' },
      { label: 'Integrations', href: '/admin/integrations' },
      { label: 'Integrations — Stripe', href: '/admin/integrations/stripe' },
      { label: 'Integrations — Env Manager', href: '/admin/integrations/env-manager' },
      { label: 'Integrations — Google Classroom', href: '/admin/integrations/google-classroom' },
      { label: 'Migrations', href: '/admin/migrations' },
      { label: 'System Jobs', href: '/admin/system/jobs' },
      { label: 'System Webhooks', href: '/admin/system/webhooks' },
      { label: 'Files', href: '/admin/files' },
      { label: 'Navigation Settings', href: '/admin/settings/nav' },
      { label: 'Impersonate', href: '/admin/impersonate' },
    ],
  },
];

/**
 * Validate that a parsed value matches NavSection[].
 * Rejects anything that could inject arbitrary hrefs.
 */
export function isNavSections(v: unknown): v is NavSection[] {
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.every(
    (s) =>
      s &&
      typeof s === 'object' &&
      typeof s.label === 'string' &&
      typeof s.href === 'string' &&
      s.href.startsWith('/admin') &&
      Array.isArray(s.items) &&
      s.items.every(
        (i: unknown) =>
          i &&
          typeof i === 'object' &&
          typeof (i as NavItem).label === 'string' &&
          typeof (i as NavItem).href === 'string' &&
          (i as NavItem).href.startsWith('/admin'),
      ),
  );
}
