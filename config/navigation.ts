// config/navigation.ts
import { siteMapSections, type SiteMapItem } from '@/config/site-map.auto';
import { canonicalRoutes } from '@/lib/routes/canonical-routes';

export type NavItem = SiteMapItem;

export type NavSection = {
  label: string;
  href?: string;
  items?: NavItem[];
};

// helper: find a section by id or title
function itemsFrom(key: string): NavItem[] {
  const section =
    siteMapSections.find((s) => s.id === key) || siteMapSections.find((s) => s.title === key);
  return section ? section.items : [];
}

/**
 * HEADER NAV - Simplified (4-6 top items max)
 */
export const headerNav: NavSection[] = [
  {
    label: 'Testing',
    href: '/testing',
    items: [
      { label: 'Testing Home', href: '/testing' },
      { label: 'Schedule Exam', href: '/testing/book' },
      { label: 'Certiport (MOS, IC3)', href: '/testing/certiport' },
      { label: 'EPA 608 Universal', href: '/testing/epa608' },
      { label: 'ACT WorkKeys / NCRC', href: '/testing/workkeys' },
      { label: 'NHA Certifications', href: '/testing/nha' },
      { label: 'NRF Rise Up', href: '/testing/riseup' },
      { label: 'ASE Certification', href: '/testing/ase' },
      { label: 'Midland Certification', href: '/testing/midland' },
      { label: 'Testing Policies', href: '/testing#policies' },
      { label: 'Accommodations', href: '/testing/accommodations' },
      { label: 'For Employers', href: '/testing/for-employers' },
    ],
  },
  {
    label: 'Programs',
    href: '/programs',
  },
  {
    label: 'Funding',
    href: '/funding',
    items: [
      { label: 'How Funding Works', href: '/funding' },
      { label: 'WIOA Funding', href: '/funding/wioa' },
      { label: 'Workforce Ready Grant', href: '/funding/wrg' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    label: 'Partners',
    href: '/admin/partners',
    items: [
      { label: 'Partner Network', href: '/admin/partners' },
      { label: 'Training Providers', href: '/training-providers' },
      { label: 'For Employers', href: '/employers' },
      { label: 'Hire Graduates', href: '/hire-graduates' },
      { label: 'Workforce Partners', href: '/workforce-partners' },
      { label: 'Career Services', href: '/career-services' },
      { label: 'Mentorship', href: '/mentorship' },
    ],
  },
  {
    label: 'Portals',
    href: '/portals',
    items: [
      { label: '🏠 All Portals', href: '/portals' },
      { label: '📚 Student Portal', href: '/lms/dashboard' },
      { label: '⚙️ Admin Portal', href: '/admin' },
      { label: '🤝 Partner Portal', href: '/partner/dashboard' },
      { label: '💼 Workforce Board', href: '/workforce-board/dashboard' },
      { label: '👥 Staff Portal', href: '/admin/staff-portal/dashboard' },
      { label: '👨‍🏫 Instructor Portal', href: '/admin/instructor/dashboard' },
      { label: '🏭 Employer Portal', href: '/employer/dashboard' },
      { label: '💈 Host Shop Portal', href: '/host-shop/dashboard' },
      { label: '👪 Parent Portal', href: '/parent-portal/dashboard' },
    ],
  },
  {
    label: 'Student Portal',
    href: '/lms/dashboard',
    items: [
      { label: 'My Dashboard', href: '/lms/dashboard' },
      { label: 'My Courses', href: '/lms/courses' },
      { label: 'Assignments', href: '/lms/assignments' },
      { label: 'Grades', href: '/lms/grades' },
      { label: 'Certificates', href: '/lms/certificates' },
      { label: 'AI Tutor', href: '/ai-tutor' },
      { label: 'Career Counseling', href: '/career-counseling' },
      { label: 'Resources', href: '/lms/resources' },
      { label: 'Support', href: '/lms/support' },
    ],
  },
  {
    label: 'LMS',
    href: 'https://elevateforhumanitylearning.com',
    items: [
      {
        label: 'LMS Dashboard',
        href: 'https://elevateforhumanitylearning.com/dashboard',
      },
      {
        label: 'My Courses',
        href: 'https://elevateforhumanitylearning.com/courses',
      },
      {
        label: 'Calendar',
        href: 'https://elevateforhumanitylearning.com/calendar',
      },
      {
        label: 'Assignments',
        href: 'https://elevateforhumanitylearning.com/assignments',
      },
      {
        label: 'Grades',
        href: 'https://elevateforhumanitylearning.com/grades',
      },
      {
        label: 'Certificates',
        href: 'https://elevateforhumanitylearning.com/certificates',
      },
      {
        label: 'Messages',
        href: 'https://elevateforhumanitylearning.com/messages',
      },
      {
        label: 'Resources',
        href: 'https://elevateforhumanitylearning.com/resources',
      },
    ],
  },
  {
    label: 'Community',
    href: '/community',
    items: [
      { label: 'Community Hub', href: '/community' },
      { label: 'Discussion Forums', href: '/forums' },
      { label: 'Study Groups', href: '/study-groups' },
      { label: 'LMS Forums', href: '/lms/forums' },
      { label: 'LMS Study Groups', href: '/lms/study-groups' },
      { label: 'Success Stories', href: '/success-stories' },
      { label: 'Student Handbook', href: '/legal/student-handbook' },
    ],
  },
  {
    label: 'Services',
    items: [
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Book Appointment', href: '/booking' },
      { label: 'Career Services', href: '/career-services' },
      { label: 'Mentorship', href: '/mentorship' },
      { label: 'Tax Services', href: '/tax-services' },
    ],
  },
  {
    label: 'Resources',
    href: '/resources',
    items: [
      { label: 'Success Stories', href: '/success-stories' },
      { label: 'Blog', href: '/blog' },
      { label: 'Videos', href: '/videos' },
      { label: 'Webinars', href: '/webinars' },
      { label: 'News', href: '/news' },
      { label: 'Events', href: '/events' },
      { label: 'Career Center', href: '/career-center' },
      { label: 'Alumni', href: '/alumni' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Help & Tutorials', href: '/help/tutorials' },
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    label: 'About',
    href: '/about',
    items: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Team', href: '/team' },
      { label: 'Platform', href: '/platform' },
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Accreditation', href: '/accreditation' },
      { label: 'Donate', href: '/donate' },
      { label: 'Volunteer', href: '/volunteer' },
      { label: 'Grants', href: '/grants' },
      { label: 'Philanthropy', href: '/philanthropy' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    label: 'Admin',
    href: '/admin',
    items: [
      { label: 'Admin Dashboard', href: '/admin' },
      { label: 'Performance Dashboard', href: '/admin/reports' },
      { label: 'Analytics Dashboard', href: '/admin/analytics' },
      { label: 'Analytics', href: '/admin/analytics' },
      { label: 'Applications', href: '/admin/applications' },
      { label: 'Enrollments', href: '/admin/enrollments' },
      { label: 'Students', href: '/admin/students' },
      { label: 'Instructors', href: '/admin/instructor' },
      { label: 'Programs', href: '/admin/programs' },
      { label: 'Partners', href: '/admin/partners' },
      { label: 'Reports', href: '/admin/reports' },
      { label: 'Payments', href: '/admin/integrations/stripe' },
      { label: 'Live Chat', href: '/admin/live-chat' },
      { label: 'Notifications', href: '/admin/notifications' },
      { label: 'Settings', href: '/admin/settings' },
      { label: 'Studio', href: '/admin/studio' },
      { label: 'Security', href: '/admin/settings/security' },
    ],
  },
  {
    label: 'Staff Portal',
    href: '/admin/staff-portal/dashboard',
    items: [
      { label: 'Dashboard', href: '/admin/staff-portal/dashboard' },
      { label: 'Training', href: '/admin/staff-portal/training' },
      { label: 'Processes', href: '/admin/staff-portal/processes' },
      { label: 'QA Checklist', href: '/admin/staff-portal/qa-checklist' },
      { label: 'Customer Service', href: '/admin/staff-portal/customer-service' },
      { label: 'Courses', href: '/admin/staff-portal/courses' },
      { label: 'Students', href: '/admin/staff-portal/students' },
    ],
  },
  {
    label: 'VITA',
    href: '/vita',
    items: [
      { label: 'VITA Home', href: '/vita' },
      { label: 'Book Appointment', href: '/vita/appointments' },
      { label: 'Upload Documents', href: '/vita/upload' },
      { label: 'Volunteer Portal', href: '/vita/volunteer-portal' },
      { label: 'Resources', href: '/vita/resources' },
    ],
  },
  {
    label: 'Community Services',
    href: '/community-services',
    items: [
      { label: 'Community Services', href: '/community-services' },
      { label: 'Book Appointment', href: '/vita/appointments' },
      { label: 'Volunteer Portal', href: '/vita/volunteer-portal' },
      { label: 'VITA Resources', href: '/vita/resources' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

/**
 * FOOTER NAV
 * - expose ALL sections (Main Pages, Programs, Funding, LMS, HR, Reports, etc.)
 * - used by SiteFooter to render a mega-footer with every page
 */
export const footerSections = siteMapSections;
