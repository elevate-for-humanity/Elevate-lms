// config/site-map.ts

export type SiteMapItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type SiteMapSection = {
  id: string;
  title: string;
  description?: string;
  items: SiteMapItem[];
};

// Base URL used only by scripts (optional)
export const SITE_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

export const siteMapSections: SiteMapSection[] = [
  {
    id: 'main-pages',
    title: 'Main Pages',
    items: [
      { label: 'Home', href: '/' },
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Apply Now', href: '/apply' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Blog', href: '/blog' },
      { label: 'Success Stories', href: '/success-stories' },
      { label: 'Get Started', href: '/get-started' },
      { label: 'Sitemap', href: '/sitemap-page' },
    ],
  },
  {
    id: 'programs',
    title: 'Programs',
    items: [
      { label: 'All Programs', href: '/programs' },
      { label: 'Medical Assistant', href: '/programs/medical-assistant' },
      { label: 'CNA (Certified Nursing Assistant)', href: '/programs/cna' },
      { label: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
      { label: 'HVAC Technician', href: '/programs/hvac-technician' },
      { label: 'Building Maintenance Tech', href: '/programs/building-maintenance-tech' },
      { label: 'CDL / Truck Driving', href: '/programs/cdl' },
      { label: 'Tax Prep (VITA)', href: '/programs/tax-prep-vita' },
      { label: 'Workforce Readiness', href: '/programs/workforce-readiness' },
      { label: 'Micro Classes', href: '/programs/micro-classes' },
    ],
  },
  {
    id: 'funding',
    title: 'Funding',
    items: [
      { label: 'Funding Overview', href: '/funding' },
      { label: 'WIOA Funding', href: '/funding/wioa' },
      { label: 'Workforce Ready Grant', href: '/funding/wrg' },
      { label: 'Job Ready Indy (JRI)', href: '/funding/jri' },
      { label: 'DOL Apprenticeships', href: '/funding/apprenticeships' },
      { label: 'Financial Aid', href: '/funding/financial-aid' },
      { label: 'WIOA Eligibility', href: '/funding/wioa-eligibility' },
    ],
  },
  {
    id: 'for-students',
    title: 'For Students',
    items: [
      { label: 'Student Dashboard', href: '/learner/dashboard' },
      { label: 'Student Portal', href: '/learner/dashboard' },
      { label: 'Student Hub', href: '/learner/dashboard' },
      { label: 'My Courses', href: '/lms/courses' },
      { label: 'Grades', href: '/lms/grades' },
      { label: 'Certificates', href: '/lms/certificates' },
      { label: 'Resources', href: '/resources' },
      { label: 'Support', href: '/support' },
      { label: 'Career Counseling', href: '/career-center/counseling' },
    ],
  },
  {
    id: 'lms',
    title: 'LMS',
    items: [
      { label: 'LMS Home', href: '/lms' },
      { label: 'LMS Dashboard', href: '/lms/dashboard' },
      { label: 'Course Catalog', href: '/courses/catalog' },
      { label: 'Assignments', href: '/lms/assignments' },
      { label: 'Calendar', href: '/lms/calendar' },
      { label: 'Certificates', href: '/lms/certificates' },
      { label: 'Achievements', href: '/lms/achievements' },
      { label: 'Discussion Forums', href: '/lms/discussions' },
    ],
  },
  {
    id: 'credentials',
    title: 'Credentials',
    items: [
      { label: 'Credentials Overview', href: '/credentials' },
      { label: 'Verify Credential', href: '/credentials/verify' },
      { label: 'Certifications', href: '/credentials/certifications' },
      { label: 'Milady Certifications', href: '/credentials/milady' },
      { label: 'Milady LMS', href: '/credentials/milady-lms' },
    ],
  },
  {
    id: 'employers',
    title: 'For Employers',
    items: [
      { label: 'Employer Overview', href: '/employers' },
      { label: 'Employer Dashboard', href: '/employers/dashboard' },
      { label: 'Hire Graduates', href: '/employers/hire-graduates' },
      { label: 'Post a Job', href: '/employers/post-job' },
      { label: 'Placements', href: '/employers/placements' },
      { label: 'OJT & Funding', href: '/employers/ojt-funding' },
    ],
  },
  {
    id: 'program-holders',
    title: 'Program Holders',
    items: [
      { label: 'Program Holders Home', href: '/program-holder' },
      { label: 'Portal', href: '/program-holder/dashboard' },
      { label: 'Universal MOU', href: '/legal/program-holder-mou' },
      { label: 'Sign MOU', href: '/program-holder/sign-mou' },
      { label: 'Become a Program Holder', href: '/apply/program-holder' },
      { label: 'Onboarding', href: '/program-holder/onboarding' },
      { label: 'Training Providers', href: '/program-holder' },
    ],
  },
  {
    id: 'career-services',
    title: 'Career Services',
    items: [
      { label: 'Career Services', href: '/career-services' },
      { label: 'Job Board', href: '/career-center/jobs' },
      { label: 'Resume Builder', href: '/career-center/resume-builder' },
      { label: 'Interview Prep', href: '/career-center/interview-prep' },
      { label: 'Career Fair', href: '/career-center/career-fair' },
    ],
  },
  {
    id: 'admin-staff',
    title: 'Admin & Staff',
    items: [
      { label: 'Admin Portal', href: '/admin' },
      { label: 'Admin Dashboard', href: '/admin/dashboard' },
      { label: 'Staff Portal', href: '/staff/portal' },
      { label: 'Certificate Management', href: '/admin/certificates' },
      { label: 'Program Holder Management', href: '/admin/program-holders' },
    ],
  },
  {
    id: 'community',
    title: 'Community',
    items: [
      { label: 'Community Hub', href: '/community' },
      { label: 'Resources', href: '/community/resources' },
      { label: 'Webinars', href: '/community/webinars' },
      { label: 'Alumni Network', href: '/community/alumni' },
      { label: 'Workforce Partners', href: '/partners/workforce' },
      { label: 'API Documentation', href: '/developer/api' },
    ],
  },
  {
    id: 'legal',
    title: 'Legal & Policies',
    items: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms of Service', href: '/legal/terms' },
      { label: 'Refund Policy', href: '/legal/refund-policy' },
      { label: 'Accessibility', href: '/legal/accessibility' },
    ],
  },
  {
    id: 'hr-payroll',
    title: 'HR & Payroll',
    items: [
      { label: 'HR Dashboard', href: '/hr/dashboard' },
      { label: 'Admin Payroll', href: '/hr/admin-payroll' },
      { label: 'Employee Payroll', href: '/hr/employee-payroll' },
      { label: 'Employees', href: '/hr/employees' },
      { label: 'Time Tracking', href: '/hr/time-tracking' },
      { label: 'Leave Management', href: '/hr/leave-management' },
      { label: 'Employee Documents', href: '/hr/employee-documents' },
      { label: 'Time Off Requests', href: '/hr/time-off-requests' },
    ],
  },
  {
    id: 'case-management',
    title: 'Case Management',
    items: [
      { label: 'Case Management', href: '/case-management' },
      { label: 'CM Documentation', href: '/case-management/docs' },
      { label: 'Delegate Dashboard', href: '/delegate/dashboard' },
      { label: 'Delegate Students', href: '/delegate/students' },
      { label: 'Delegate Reports', href: '/delegate/reports' },
      { label: 'Delegate Messages', href: '/delegate/messages' },
    ],
  },
  {
    id: 'boards',
    title: 'Boards',
    items: [
      { label: 'Board Dashboard', href: '/boards/dashboard' },
      { label: 'Board Referrals', href: '/boards/referrals' },
      { label: 'Workforce Board', href: '/boards/workforce' },
      { label: 'Workforce Boards Platform', href: '/boards/platform' },
    ],
  },
  {
    id: 'special-programs',
    title: 'Special Programs',
    items: [
      { label: 'VITA Tax Program', href: '/programs/vita-tax' },
      { label: 'Selfish Inc', href: '/programs/selfish-inc' },
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    items: [
      { label: 'File Manager', href: '/tools/file-manager' },
      { label: 'Sheets', href: '/tools/sheets' },
      { label: 'Slides', href: '/tools/slides' },
      { label: 'Video', href: '/tools/video' },
      { label: 'Videos', href: '/tools/videos' },
      { label: 'Chat', href: '/tools/chat' },
      { label: 'Messages', href: '/tools/messages' },
      { label: 'Calendar', href: '/tools/calendar' },
      { label: 'Search', href: '/tools/search' },
      { label: 'Directory', href: '/tools/directory' },
    ],
  },
  {
    id: 'builders',
    title: 'Builders',
    items: [
      { label: 'Course Builder', href: '/builders/course-builder' },
      { label: 'AI Course Builder', href: '/builders/ai-course-builder' },
      { label: 'Course Builder (Public)', href: '/builders/course-builder-public' },
      { label: 'Quiz Builder', href: '/builders/quiz-builder' },
      { label: 'Syllabus Generator', href: '/builders/syllabus-generator' },
      { label: 'Program Generator', href: '/builders/program-generator' },
      { label: 'Video Upload', href: '/builders/video-upload' },
      { label: 'Curriculum Upload', href: '/builders/curriculum-upload' },
      { label: 'Curriculum Upload (Alt)', href: '/builders/curriculum-upload-alt' },
      { label: 'Create Course', href: '/builders/create-course' },
    ],
  },
  {
    id: 'documents',
    title: 'Documents',
    items: [
      { label: 'Document Center', href: '/documents' },
      { label: 'Upload Documents', href: '/documents/upload' },
      { label: 'Employee Documents', href: '/hr/employee-documents' },
      { label: 'NotebookLM', href: '/documents/notebooklm' },
      { label: 'Internal Docs', href: '/documents/internal' },
    ],
  },
  {
    id: 'instructor',
    title: 'Instructor',
    items: [
      { label: 'Instructor Dashboard', href: '/admin/instructor/dashboard' },
      { label: 'Instructor Analytics', href: '/admin/instructor/analytics' },
      { label: 'Educator Hub', href: '/admin/instructor/educator-hub' },
      { label: 'Receptionist', href: '/admin/instructor/receptionist' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    items: [
      { label: 'Reports', href: '/reports' },
      { label: 'Admin Reports', href: '/reports/admin' },
      { label: 'Caseload Reports', href: '/reports/caseload' },
      { label: 'Charts', href: '/reports/charts' },
      { label: 'Analytics', href: '/reports/analytics' },
      { label: 'Analytics Dashboard', href: '/reports/analytics-dashboard' },
      { label: 'Workforce Analytics', href: '/reports/workforce' },
    ],
  },
];
