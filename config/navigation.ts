// config/navigation.ts
import { siteMapSections, type SiteMapItem } from '@/config/site-map.auto';

export type NavItem = SiteMapItem;

export type NavSection = {
  label: string;
  href?: string;
  items?: NavItem[];
};

// helper: find a section by id or title
function itemsFrom(key: string): NavItem[] {
  const section =
    siteMapSections.find((s) => s.id === key) ||
    siteMapSections.find((s) => s.title === key);
  return section ? section.items : [];
}

/**
 * HEADER NAV - Simplified (4-6 top items max)
 */
export const headerNav: NavSection[] = [
  {
    label: 'Programs',
    href: '/programs',
    items: [
      { label: 'View All Programs', href: '/programs' },
      { label: 'Medical Assistant', href: '/programs/medical-assistant' },
      {
        label: 'Barber Apprenticeship',
        href: '/programs/barber-apprenticeship',
      },
      { label: 'HVAC Technician', href: '/programs/hvac-technician' },
      { label: 'CDL Training', href: '/programs/cdl' },
      { label: 'CNA Healthcare', href: '/programs/cna' },
      { label: 'Workforce Readiness', href: '/programs/workforce-readiness' },
    ],
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
    label: 'How It Works',
    href: '/how-it-works',
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
      { label: '💼 Workforce Board', href: '/workforce-board' },
      { label: '🏢 Program Holder', href: '/program-holder/portal' },
      { label: '👥 Staff Portal', href: '/staff-portal/dashboard' },
      { label: '📊 Board Dashboard', href: '/board/dashboard' },
      { label: '💈 Shop Dashboard', href: '/shop/dashboard' },
      { label: '👨‍🏫 Instructor Dashboard', href: '/instructor/dashboard' },
      { label: '🏭 Employer Dashboard', href: '/employer/dashboard' },
      { label: '✨ Creator Dashboard', href: '/creator/dashboard' },
      { label: '🔄 Delegate Dashboard', href: '/delegate/dashboard' },
      { label: '👪 Parent Portal', href: '/portal/parent/dashboard' },
    ],
  },
  {
    label: 'Student Portal',
    href: '/student/dashboard',
    items: [
      { label: 'My Dashboard', href: '/student/dashboard' },
      { label: 'My Courses', href: '/student/courses' },
      { label: 'Assignments', href: '/student/assignments' },
      { label: 'Grades', href: '/student/grades' },
      { label: 'Certificates', href: '/student/certificates' },
      { label: 'AI Tutor', href: '/student/ai-tutor' },
      { label: 'Career Counseling', href: '/student/career-counseling' },
      { label: 'Resources', href: '/student/resources' },
      { label: 'Support', href: '/student/support' },
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
      { label: 'Student Handbook', href: '/student-handbook' },
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
      { label: 'Supersonic Fast Cash', href: '/supersonic-fast-cash' },
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
      { label: 'Performance Dashboard', href: '/admin/performance-dashboard' },
      { label: 'Analytics Dashboard', href: '/admin/analytics-dashboard' },
      { label: 'Analytics', href: '/admin/analytics' },
      { label: 'Applications', href: '/admin/applications' },
      { label: 'Enrollments', href: '/admin/enrollments' },
      { label: 'Students', href: '/admin/students' },
      { label: 'Instructors', href: '/admin/instructors' },
      { label: 'Programs', href: '/admin/programs' },
      { label: 'Partners', href: '/admin/partners' },
      { label: 'Reports', href: '/admin/reports' },
      { label: 'Payments', href: '/admin/payments' },
      { label: 'Live Chat', href: '/admin/live-chat' },
      { label: 'Notifications', href: '/admin/notifications' },
      { label: 'Settings', href: '/admin/settings' },
      { label: 'AI Course Builder', href: '/admin/ai-course-builder' },
      { label: 'Security', href: '/admin/security' },
    ],
  },
  {
    label: 'Staff Portal',
    href: '/staff-portal/dashboard',
    items: [
      { label: 'Dashboard', href: '/staff-portal/dashboard' },
      { label: 'Training', href: '/staff-portal/training' },
      { label: 'Processes', href: '/staff-portal/processes' },
      { label: 'QA Checklist', href: '/staff-portal/qa-checklist' },
      { label: 'Customer Service', href: '/staff-portal/customer-service' },
      { label: 'Courses', href: '/staff-portal/courses' },
      { label: 'Students', href: '/staff-portal/students' },
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
    label: 'Rise Foundation',
    href: '/rise-foundation',
    items: [
      { label: 'About', href: '/rise-foundation/about' },
      { label: 'Donate', href: '/rise-foundation/donate' },
      { label: 'Events', href: '/rise-foundation/events' },
      { label: 'Programs', href: '/rise-foundation/programs' },
      { label: 'Get Involved', href: '/rise-foundation/get-involved' },
    ],
  },
];

/**
 * FOOTER NAV
 * - expose ALL sections (Main Pages, Programs, Funding, LMS, HR, Reports, etc.)
 * - used by SiteFooter to render a mega-footer with every page
 */
export const footerSections = siteMapSections;
