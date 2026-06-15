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

const ADMIN_NAV_HREF_ALIASES: Record<string, string> = {
  '/admin/analytics-dashboard': '/admin/analytics',
  '/admin/command-center': '/admin/mission-control',
  '/admin/dashboard?tab=environments': '/admin/integrations/env-manager',
  '/admin/dashboard?tab=services': '/admin/dev-studio',
  '/admin/instructors': '/admin/instructor',
  '/admin/payments': '/admin/integrations/stripe',
  '/admin/performance-dashboard': '/admin/reports',
  '/admin/security': '/admin/settings/security',
  // Legacy redirects
  '/admin/studio': '/admin/dev-studio?tab=courses',
  '/admin/quizzes': '/admin/dev-studio?tab=courses',
};

export function normalizeAdminHref(href: string): string {
  return ADMIN_NAV_HREF_ALIASES[href] ?? href;
}

export function normalizeAdminNavSections(sections: NavSection[]): NavSection[] {
  return sections.map((section) => {
    const seen = new Set<string>();
    const items = section.items
      .map((item) => ({
        ...item,
        href: normalizeAdminHref(item.href),
      }))
      .filter((item) => {
        const key = `${item.label}::${item.href}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return {
      ...section,
      href: normalizeAdminHref(section.href),
      items,
    };
  });
}

export const DEFAULT_NAV: NavSection[] = [
  {
    label: 'Operations',
    href: '/admin/operations',
    items: [
      { label: 'Admin Home', href: '/admin' },
      { label: 'Activity', href: '/admin/activity' },
      { label: 'Advanced Tools', href: '/admin/advanced-tools' },
      { label: 'Analytics', href: '/admin/analytics' },
      { label: 'Analytics — Employers', href: '/admin/analytics/employers' },
      { label: 'Analytics — Engagement', href: '/admin/analytics/engagement' },
      { label: 'Analytics — Learning', href: '/admin/analytics/learning' },
      { label: 'Analytics — Programs', href: '/admin/analytics/programs' },
      { label: 'Analytics — Revenue', href: '/admin/analytics/revenue' },
      { label: 'At-Risk Learners', href: '/admin/at-risk' },
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'Inbox', href: '/admin/inbox' },
      { label: 'Internal Docs', href: '/admin/internal-docs' },
      { label: 'Media Studio', href: '/admin/media-studio' },
      { label: 'Mission Control', href: '/admin/mission-control' },
      { label: 'Monitoring', href: '/admin/monitoring' },
      { label: 'Monitoring — Setup', href: '/admin/monitoring/setup' },
      { label: 'Notifications', href: '/admin/notifications' },
      { label: 'Operations Hub', href: '/admin/operations' },
      { label: 'Platform', href: '/admin/platform' },
      { label: 'Proctor Portal', href: '/admin/proctor-portal' },
      { label: 'Promo Codes', href: '/admin/promo-codes' },
      { label: 'RAPIDS', href: '/admin/rapids' },
      { label: 'Reports', href: '/admin/reports' },
      { label: 'Reports — Caseload', href: '/admin/reports/caseload' },
      { label: 'Reports — Charts', href: '/admin/reports/charts' },
      { label: 'Reports — Enrollment', href: '/admin/reports/enrollment' },
      { label: 'Reports — Financial', href: '/admin/reports/financial' },
      { label: 'Reports — Leads', href: '/admin/reports/leads' },
      { label: 'Reports — Partners', href: '/admin/reports/partners' },
      { label: 'Reports — Samples', href: '/admin/reports/samples' },
      { label: 'Reports — Users', href: '/admin/reports/users' },
      { label: 'Reports — WIOA', href: '/admin/reports/wioa' },
      { label: 'Site Audit', href: '/admin/site-audit' },
      { label: 'Student Access', href: '/admin/student-access' },
      { label: 'Student Hours', href: '/admin/student-hours' },
      { label: 'System Health', href: '/admin/system-health' },
      { label: 'Timeclock', href: '/admin/timeclock' },
      { label: 'Video Generator', href: '/admin/video-generator' },
    ],
  },
  {
    label: 'Intelligence',
    href: '/admin/intelligence',
    items: [
      { label: 'Risk Dashboard', href: '/admin/intelligence' },
      { label: 'Completion Forecast', href: '/admin/intelligence/forecast' },
      { label: 'Snapshots', href: '/admin/snapshots' },
    ],
  },
  {
    label: 'Automation',
    href: '/admin/dev-studio',
    items: [
      { label: 'Dev Studio', href: '/admin/dev-studio' },
      { label: 'Workflows', href: '/admin/dev-studio/workflows' },
      { label: 'Course Builder', href: '/admin/dev-studio/courses' },
      { label: 'Automation Log', href: '/admin/automation' },
      { label: 'Agents', href: '/admin/dev-studio/agents' },
      { label: 'Builds', href: '/admin/dev-studio/builds' },
      { label: 'Deployments', href: '/admin/dev-studio/deployments' },
      { label: 'Logs', href: '/admin/dev-studio/logs' },
      { label: 'Memory', href: '/admin/dev-studio/memory' },
      { label: 'Settings', href: '/admin/dev-studio/settings' },
      { label: 'Tasks', href: '/admin/dev-studio/tasks' },
    ],
  },
  {
    label: 'Instructor',
    href: '/admin/instructor/dashboard',
    items: [
      { label: 'Instructor', href: '/admin/instructor' },
      { label: 'Analytics', href: '/admin/instructor/analytics' },
      { label: 'Announcements', href: '/admin/instructor/announcements' },
      { label: 'Attendance', href: '/admin/instructor/attendance' },
      { label: 'Instructor — Campaigns', href: '/admin/instructor/campaigns' },
      { label: 'Courses', href: '/admin/instructor/courses' },
      { label: 'Dashboard', href: '/admin/instructor/dashboard' },
      { label: 'Instructor — Documents', href: '/admin/instructor/documents' },
      { label: 'Gradebook', href: '/admin/instructor/gradebook' },
      { label: 'Programs', href: '/admin/instructor/programs' },
      { label: 'Settings', href: '/admin/instructor/settings' },
      { label: 'Students', href: '/admin/instructor/students' },
      { label: 'Instructor — Students — New', href: '/admin/instructor/students/new' },
      { label: 'Submissions', href: '/admin/instructor/submissions' },
    ],
  },
  {
    label: 'Staff Portal',
    href: '/admin/staff-portal/dashboard',
    items: [
      { label: 'Staff Portal', href: '/admin/staff-portal' },
      { label: 'Attendance', href: '/admin/staff-portal/attendance' },
      { label: 'Staff Portal — Attendance — Export', href: '/admin/staff-portal/attendance/export' },
      { label: 'Staff Portal — Attendance — Record', href: '/admin/staff-portal/attendance/record' },
      { label: 'Staff Portal — Attendance — Take', href: '/admin/staff-portal/attendance/take' },
      { label: 'Booth Renters', href: '/admin/staff-portal/booth-renters' },
      { label: 'Campaigns', href: '/admin/staff-portal/campaigns' },
      { label: 'Cases', href: '/admin/staff-portal/cases' },
      { label: 'Courses', href: '/admin/staff-portal/courses' },
      { label: 'Staff Portal — Courses — Create', href: '/admin/staff-portal/courses/create' },
      { label: 'Customer Service', href: '/admin/staff-portal/customer-service' },
      { label: 'Dashboard', href: '/admin/staff-portal/dashboard' },
      { label: 'Staff Portal — Processes', href: '/admin/staff-portal/processes' },
      { label: 'QA Checklist', href: '/admin/staff-portal/qa-checklist' },
      { label: 'Skills', href: '/admin/staff-portal/skills' },
      { label: 'Students', href: '/admin/staff-portal/students' },
      { label: 'Staff Portal — Students — Add', href: '/admin/staff-portal/students/add' },
      { label: 'Training', href: '/admin/staff-portal/training' },
      { label: 'Staff Portal — Users', href: '/admin/staff-portal/users' },
    ],
  },
  {
    label: 'Students',
    href: '/admin/students',
    items: [
      { label: 'Applications', href: '/admin/applications' },
      { label: 'Barriers', href: '/admin/barriers' },
      { label: 'Certificates', href: '/admin/certificates' },
      { label: 'Certificates — Bulk', href: '/admin/certificates/bulk' },
      { label: 'Certificates — Issue', href: '/admin/certificates/issue' },
      { label: 'Cohorts', href: '/admin/cohorts' },
      { label: 'Cohorts — New', href: '/admin/cohorts/new' },
      { label: 'Enrollment Jobs', href: '/admin/enrollment-jobs' },
      { label: 'Enrollments', href: '/admin/enrollments' },
      { label: 'Exam Authorizations', href: '/admin/exam-authorizations' },
      { label: 'Gradebook', href: '/admin/gradebook' },
      { label: 'Referrals', href: '/admin/referrals' },
      { label: 'All Students', href: '/admin/students' },
      { label: 'Students — Export', href: '/admin/students/export' },
      { label: 'Submissions', href: '/admin/submissions' },
      { label: 'Submissions — Attachments', href: '/admin/submissions/attachments' },
      { label: 'Submissions — Compliance', href: '/admin/submissions/compliance' },
      { label: 'Submissions — Content', href: '/admin/submissions/content' },
      { label: 'Submissions — Exceptions', href: '/admin/submissions/exceptions' },
      { label: 'Submissions — Facts', href: '/admin/submissions/facts' },
      { label: 'Submissions — Opportunities', href: '/admin/submissions/opportunities' },
      { label: 'Submissions — Org', href: '/admin/submissions/org' },
      { label: 'Submissions — Partners', href: '/admin/submissions/partners' },
      { label: 'Submissions — Past Performance', href: '/admin/submissions/past-performance' },
      { label: 'Submissions — Templates', href: '/admin/submissions/templates' },
      { label: 'Testing Center', href: '/admin/testing-center' },
      { label: 'Transfer Hours', href: '/admin/transfer-hours' },
      { label: 'Verifications', href: '/admin/verifications' },
      { label: 'Verifications — Review', href: '/admin/verifications/review' },
      { label: 'Waitlist', href: '/admin/waitlist' },
      { label: 'WorkOne Queue', href: '/admin/workone-queue' },
    ],
  },
  {
    label: 'Programs',
    href: '/admin/programs',
    items: [
      { label: 'Apprenticeships', href: '/admin/apprenticeships' },
      { label: 'Career Courses', href: '/admin/career-courses' },
      { label: 'Career Courses — Create', href: '/admin/career-courses/create' },
      { label: 'CMI', href: '/admin/cmi' },
      { label: 'Course Import', href: '/admin/course-import' },
      { label: 'All Courses', href: '/admin/courses' },
      { label: 'Courses — Bulk Operations', href: '/admin/courses/bulk-operations' },
      { label: 'Courses — Create', href: '/admin/courses/create' },
      { label: 'Courses — Generate', href: '/admin/courses/generate' },
      { label: 'Courses — Partners', href: '/admin/courses/partners' },
      { label: 'Courses — Pipeline', href: '/admin/courses/pipeline' },
      { label: 'Credentials', href: '/admin/credentials' },
      { label: 'Credentials — New', href: '/admin/credentials/new' },
      { label: 'Curriculum', href: '/admin/curriculum' },
      { label: 'Curriculum — Upload', href: '/admin/curriculum/upload' },
      { label: 'ETPL Dashboard', href: '/admin/dashboard/etpl' },
      { label: 'External Completions', href: '/admin/external-course-completions' },
      { label: 'External Progress', href: '/admin/external-progress' },
      { label: 'Instructors', href: '/admin/instructor' },
      { label: 'Instructors — Performance', href: '/admin/instructors/performance' },
      { label: 'Learning Paths', href: '/admin/learning-paths' },
      { label: 'Learning Paths — New', href: '/admin/learning-paths/new' },
      { label: 'Modules', href: '/admin/modules' },
      { label: 'Modules — New', href: '/admin/modules/new' },
      { label: 'All Programs', href: '/admin/programs' },
      { label: 'Programs — Catalog', href: '/admin/programs/catalog' },
      { label: 'Create Program', href: '/admin/programs/new' },
      { label: 'Quizzes', href: '/admin/quizzes' },
      { label: 'Studio', href: '/admin/studio' },
      { label: 'Videos', href: '/admin/videos' },
      { label: 'Videos — Upload', href: '/admin/videos/upload' },
    ],
  },
  {
    label: 'Funding',
    href: '/admin/funding',
    items: [
      { label: 'Contracts', href: '/admin/contracts' },
      { label: 'Funding Overview', href: '/admin/funding' },
      { label: 'Funding Verification', href: '/admin/funding-verification' },
      { label: 'Grants', href: '/admin/grants' },
      { label: 'Grants — Applications', href: '/admin/grants/applications' },
      { label: 'Grants — Applications — New', href: '/admin/grants/applications/new' },
      { label: 'Grants — Intake', href: '/admin/grants/intake' },
      { label: 'Grants — Opportunities', href: '/admin/grants/opportunities' },
      { label: 'Grants — Revenue', href: '/admin/grants/revenue' },
      { label: 'Grants — Snap Et', href: '/admin/grants/snap-et' },
      { label: 'Grants — Submissions', href: '/admin/grants/submissions' },
      { label: 'Grants — Workflow', href: '/admin/grants/workflow' },
      { label: 'Incentives', href: '/admin/incentives' },
      { label: 'Incentives — Create', href: '/admin/incentives/create' },
      { label: 'JRI', href: '/admin/jri' },
      { label: 'JRI — Participants', href: '/admin/jri/participants' },
      { label: 'JRI — Participants — New', href: '/admin/jri/participants/new' },
      { label: 'JRI — Reports', href: '/admin/jri/reports' },
      { label: 'Payout Queue', href: '/admin/payout-queue' },
      { label: 'Payroll Cards', href: '/admin/payroll-cards' },
      { label: 'WIOA', href: '/admin/wioa' },
      { label: 'WIOA — Documents', href: '/admin/wioa/documents' },
      { label: 'WIOA — Eligibility', href: '/admin/wioa/eligibility' },
      { label: 'WIOA — Iep', href: '/admin/wioa/iep' },
      { label: 'WIOA — New', href: '/admin/wioa/new' },
      { label: 'WIOA — Verify', href: '/admin/wioa/verify' },
      { label: 'WOTC', href: '/admin/wotc' },
      { label: 'WOTC — New', href: '/admin/wotc/new' },
    ],
  },
  {
    label: 'Partners',
    href: '/admin/employers',
    items: [
      { label: 'Affiliates', href: '/admin/affiliates' },
      { label: 'Affiliates — New', href: '/admin/affiliates/new' },
      { label: 'Delegates', href: '/admin/delegates' },
      { label: 'Employers', href: '/admin/employers' },
      { label: 'Employers — New', href: '/admin/employers/new' },
      { label: 'Employers — Onboarding', href: '/admin/employers/onboarding' },
      { label: 'Jobs', href: '/admin/jobs' },
      { label: 'Jobs — New', href: '/admin/jobs/new' },
      { label: 'Marketplace', href: '/admin/marketplace' },
      { label: 'Marketplace — Creators', href: '/admin/marketplace/creators' },
      { label: 'Marketplace — Payouts', href: '/admin/marketplace/payouts' },
      { label: 'Marketplace — Products', href: '/admin/marketplace/products' },
      { label: 'Partner Enrollments', href: '/admin/partner-enrollments' },
      { label: 'Partner Inquiries', href: '/admin/partner-inquiries' },
      { label: 'Partners', href: '/admin/partners' },
      { label: 'Partners — Applications', href: '/admin/partners/applications' },
      { label: 'Partners — Lms Integrations', href: '/admin/partners/lms-integrations' },
      { label: 'Program Holder Acknowledgements', href: '/admin/program-holder-acknowledgements' },
      { label: 'Program Holder Documents', href: '/admin/program-holder-documents' },
      { label: 'Program Holders', href: '/admin/program-holders' },
      { label: 'Program Holders — Verification', href: '/admin/program-holders/verification' },
      { label: 'Provider Applications', href: '/admin/provider-applications' },
      { label: 'Providers', href: '/admin/providers' },
      { label: 'Shops', href: '/admin/shops' },
      { label: 'Shops — Geocoding', href: '/admin/shops/geocoding' },
      { label: 'Tenants', href: '/admin/tenants' },
    ],
  },
  {
    label: 'Marketing',
    href: '/admin/crm',
    items: [
      { label: 'Blog', href: '/admin/blog' },
      { label: 'Content Management', href: '/admin/content' },
      { label: 'CRM', href: '/admin/crm' },
      { label: 'CRM — Appointments', href: '/admin/crm/appointments' },
      { label: 'CRM — Appointments — New', href: '/admin/crm/appointments/new' },
      { label: 'CRM — Campaigns', href: '/admin/crm/campaigns' },
      { label: 'CRM — Campaigns — New', href: '/admin/crm/campaigns/new' },
      { label: 'CRM — Contacts', href: '/admin/crm/contacts' },
      { label: 'CRM — Contacts — New', href: '/admin/crm/contacts/new' },
      { label: 'CRM — Deals', href: '/admin/crm/deals' },
      { label: 'CRM — Deals — New', href: '/admin/crm/deals/new' },
      { label: 'CRM — Follow-Ups', href: '/admin/crm/follow-ups' },
      { label: 'CRM — Leads', href: '/admin/crm/leads' },
      { label: 'CRM — Leads — New', href: '/admin/crm/leads/new' },
      { label: 'Email Marketing', href: '/admin/email-marketing' },
      { label: 'Email Marketing — Analytics', href: '/admin/email-marketing/analytics' },
      { label: 'Email Marketing — Automation', href: '/admin/email-marketing/automation' },
      { label: 'Email Marketing — Automation — New', href: '/admin/email-marketing/automation/new' },
      { label: 'Email Marketing — Campaigns — New', href: '/admin/email-marketing/campaigns/new' },
      { label: 'Email Marketing — Sendgrid', href: '/admin/email-marketing/sendgrid' },
      { label: 'Live Chat', href: '/admin/live-chat' },
      { label: 'Page Builder', href: '/admin/page-builder' },
      { label: 'Social Media — Campaigns — New', href: '/admin/social-media/campaigns/new' },
      { label: 'Store', href: '/admin/store' },
      { label: 'Store — Catalog', href: '/admin/store/catalog' },
      { label: 'Store — Clones', href: '/admin/store/clones' },
    ],
  },
  {
    label: 'Compliance',
    href: '/admin/compliance',
    items: [
      { label: 'Accreditation', href: '/admin/accreditation' },
      { label: 'Accreditation — Report', href: '/admin/accreditation/report' },
      { label: 'Audit Logs', href: '/admin/audit-logs' },
      { label: 'Barber Shop Applications', href: '/admin/barber-shop-applications' },
      { label: 'Compliance', href: '/admin/compliance' },
      { label: 'Compliance Audit', href: '/admin/compliance-audit' },
      { label: 'Compliance — Agreements', href: '/admin/compliance/agreements' },
      { label: 'Compliance — Automation', href: '/admin/compliance/automation' },
      { label: 'Compliance — Deletions', href: '/admin/compliance/deletions' },
      { label: 'Compliance — Exports', href: '/admin/compliance/exports' },
      { label: 'Compliance — Financial Assurance', href: '/admin/compliance/financial-assurance' },
      { label: 'Compliance — Financial Assurance — New', href: '/admin/compliance/financial-assurance/new' },
      { label: 'WIOA / ETPL Forms', href: '/admin/compliance/wioa-etpl' },
      { label: 'Docs', href: '/admin/docs' },
      { label: 'Docs — MOU', href: '/admin/docs/mou' },
      { label: 'Docs — MOU — New', href: '/admin/docs/mou/new' },
      { label: 'Document Center', href: '/admin/document-center' },
      { label: 'Documents', href: '/admin/documents' },
      { label: 'Documents — Print', href: '/admin/documents/print' },
      { label: 'Documents — Review', href: '/admin/documents/review' },
      { label: 'Documents — Templates', href: '/admin/documents/templates' },
      { label: 'Documents — Upload', href: '/admin/documents/upload' },
      { label: 'FERPA', href: '/admin/ferpa' },
      { label: 'FERPA — Access Requests', href: '/admin/ferpa/access-requests' },
      { label: 'FERPA — Audit Log', href: '/admin/ferpa/audit-log' },
      { label: 'FERPA — Consent Forms', href: '/admin/ferpa/consent-forms' },
      { label: 'FERPA — Directory Info', href: '/admin/ferpa/directory-info' },
      { label: 'FERPA Training', href: '/admin/ferpa/training' },
      { label: 'Fssa Impact', href: '/admin/fssa-impact' },
      { label: 'Fssa Impact — Attendance', href: '/admin/fssa-impact/attendance' },
      { label: 'Fssa Impact — Budget', href: '/admin/fssa-impact/budget' },
      { label: 'Fssa Impact — Intake', href: '/admin/fssa-impact/intake' },
      { label: 'Fssa Impact — Participants', href: '/admin/fssa-impact/participants' },
      { label: 'Fssa Impact — Tpp Survey', href: '/admin/fssa-impact/tpp-survey' },
      { label: 'Governance', href: '/admin/governance' },
      { label: 'Governance — Authoritative Docs', href: '/admin/governance/authoritative-docs' },
      { label: 'Governance — Compliance', href: '/admin/governance/compliance' },
      { label: 'Governance — Contact', href: '/admin/governance/contact' },
      { label: 'Governance — Data', href: '/admin/governance/data' },
      { label: 'Governance — Legal', href: '/admin/governance/legal' },
      { label: 'Governance — Operational Controls', href: '/admin/governance/operational-controls' },
      { label: 'Governance — Security', href: '/admin/governance/security' },
      { label: 'Governance — Seo Indexing', href: '/admin/governance/seo-indexing' },
      { label: 'HR', href: '/admin/hr' },
      { label: 'HR — Employees', href: '/admin/hr/employees' },
      { label: 'HR — Employees — New', href: '/admin/hr/employees/new' },
      { label: 'HR — Leave', href: '/admin/hr/leave' },
      { label: 'HR — Payroll', href: '/admin/hr/payroll' },
      { label: 'HR — Time', href: '/admin/hr/time' },
      { label: 'MOU', href: '/admin/mou' },
      { label: 'Review Queue', href: '/admin/review-queue' },
      { label: 'Signatures', href: '/admin/signatures' },
      { label: 'Signatures — New', href: '/admin/signatures/new' },
    ],
  },
  {
    label: 'System',
    href: '/admin/settings',
    items: [
      { label: 'API Keys', href: '/admin/api-keys' },
      { label: 'Billing', href: '/admin/billing' },
      { label: 'Billing — Addons', href: '/admin/billing/addons' },
      { label: 'Billing — Feature Flags', href: '/admin/billing/feature-flags' },
      { label: 'Billing — Invoices', href: '/admin/billing/invoices' },
      { label: 'Billing — Licenses', href: '/admin/billing/licenses' },
      { label: 'Billing — Plans', href: '/admin/billing/plans' },
      { label: 'Billing — Subscriptions', href: '/admin/billing/subscriptions' },
      { label: 'Billing — Usage', href: '/admin/billing/usage' },
      { label: 'Data Import', href: '/admin/data-import' },
      { label: 'Dev Studio', href: '/admin/dev-studio' },
      { label: 'Dev Studio — Agents', href: '/admin/dev-studio/agents' },
      { label: 'Dev Studio — Builds', href: '/admin/dev-studio/builds' },
      { label: 'Dev Studio — Deployments', href: '/admin/dev-studio/deployments' },
      { label: 'Dev Studio — Logs', href: '/admin/dev-studio/logs' },
      { label: 'Dev Studio — Memory', href: '/admin/dev-studio/memory' },
      { label: 'Dev Studio — Settings', href: '/admin/dev-studio/settings' },
      { label: 'Dev Studio — Tasks', href: '/admin/dev-studio/tasks' },
      { label: 'Dev Studio — Workflows', href: '/admin/dev-studio/workflows' },
      { label: 'Files', href: '/admin/files' },
      { label: 'Impersonate', href: '/admin/impersonate' },
      { label: 'Integrations', href: '/admin/integrations' },
      { label: 'Integrations — Calendly', href: '/admin/integrations/calendly' },
      { label: 'Integrations — Env Manager', href: '/admin/integrations/env-manager' },
      { label: 'Integrations — Gemini', href: '/admin/integrations/gemini' },
      { label: 'Integrations — Google Classroom', href: '/admin/integrations/google-classroom' },
      { label: 'Integrations — Quickbooks', href: '/admin/integrations/quickbooks' },
      { label: 'Integrations — Salesforce', href: '/admin/integrations/salesforce' },
      { label: 'Integrations — Stripe', href: '/admin/integrations/stripe' },
      { label: 'Integrations — Teams', href: '/admin/integrations/teams' },
      { label: 'License Requests', href: '/admin/license-requests' },
      { label: 'Licenses', href: '/admin/licenses' },
      { label: 'Licenses — Create', href: '/admin/licenses/create' },
      { label: 'Migrations', href: '/admin/migrations' },
      { label: 'Settings', href: '/admin/settings' },
      { label: 'Settings — Email', href: '/admin/settings/email' },
      { label: 'Settings — General', href: '/admin/settings/general' },
      { label: 'Settings — Integrations', href: '/admin/settings/integrations' },
      { label: 'Navigation Settings', href: '/admin/settings/nav' },
      { label: 'Settings — Notifications', href: '/admin/settings/notifications' },
      { label: 'Settings — Organization Profile', href: '/admin/settings/organization-profile' },
      { label: 'Settings — Payments', href: '/admin/settings/payments' },
      { label: 'Settings — Security', href: '/admin/settings/security' },
      { label: 'Settings — Site Stats', href: '/admin/settings/site-stats' },
      { label: 'Settings — Social Media', href: '/admin/settings/social-media' },
      { label: 'Staff', href: '/admin/staff' },
      { label: 'System', href: '/admin/system' },
      { label: 'System Jobs', href: '/admin/system/jobs' },
      { label: 'System Webhooks', href: '/admin/system/webhooks' },
    ],
  }
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
