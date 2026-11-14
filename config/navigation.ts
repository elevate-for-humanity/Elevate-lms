// config/navigation.ts
import { siteMapSections, type SiteMapItem } from '@/config/site-map.auto';
import { canonicalRoutes } from '@/lib/routes/canonical-routes';

export type NavItem = SiteMapItem;

export type NavSection = {
  label: string;
  href?: string;
  items?: NavItem[];
};

function itemsFrom(key: string): NavItem[] {
  const section =
    siteMapSections.find((s) => s.id === key) || siteMapSections.find((s) => s.title === key);
  return section ? section.items : [];
}

export const headerNav: NavSection[] = [
  {
    label: 'Testing',
    href: '/testing',
    items: [
      { label: 'Testing Center', href: '/testing' },
      { label: 'Choose an Exam', href: '/testing' },
      { label: 'Certiport', href: '/testing/certiport' },
      { label: 'WorkKeys', href: '/testing/workkeys' },
      { label: 'Policies', href: '/testing/policies' },
    ],
  },
  {
    label: 'Programs',
    href: '/programs',
    items: [
      { label: 'All Programs', href: '/programs' },
      { label: 'Healthcare', href: '/programs/healthcare' },
      { label: 'Skilled Trades', href: '/programs/skilled-trades' },
      { label: 'Beauty & Cosmetology', href: '/barber-and-beauty-apprenticeships' },
      { label: 'Technology', href: '/programs/technology' },
      { label: 'Business', href: '/programs/business' },
    ],
  },
  {
    label: 'Funding',
    href: '/funding',
    items: [
      { label: 'Funding Options', href: '/funding' },
      { label: 'WIOA', href: '/funding/wioa' },
      { label: 'Scholarships', href: '/scholarships' },
    ],
  },
  {
    label: 'Partners',
    href: '/partners',
    items: [
      { label: 'Our Partners', href: '/partners' },
      { label: 'For Employers', href: '/employers' },
      { label: 'Workforce Agencies', href: '/for-agencies' },
      { label: 'Host Shops', href: '/partners/barbershop-apprenticeship/host-shops' },
    ],
  },
  {
    label: 'Resources',
    href: '/help',
    items: [
      { label: 'Help Center', href: '/help' },
      { label: 'Career Services', href: '/career-services' },
      { label: 'Videos', href: '/videos' },
      { label: 'FAQs', href: '/faq' },
      { label: 'Contact', href: '/contact' },
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
    ],
  },
];

export const footerSections = [
  {
    id: 'company',
    title: 'Company',
    items: [
      { label: 'About Us', href: '/about', description: 'Learn about our mission' },
      { label: 'Contact', href: '/contact', description: 'Get in touch' },
      { label: 'Partners', href: '/partners', description: 'Our partner network' },
      { label: 'Employers', href: '/employers', description: 'Hire our graduates' },
    ],
  },
  {
    id: 'resources',
    title: 'Resources',
    items: [
      { label: 'Help Center', href: '/help', description: 'FAQs and support' },
      { label: 'Funding', href: '/funding', description: 'Financial assistance' },
      { label: 'Career Services', href: '/career-services', description: 'Job placement help' },
      { label: 'Testing Center', href: '/testing', description: 'View credential exams' },
    ],
  },
  {
    id: 'legal',
    title: 'Legal',
    items: [
      { label: 'Privacy Policy', href: '/privacy', description: 'How we protect your data' },
      { label: 'Terms of Service', href: '/terms', description: 'Service terms' },
      { label: 'Accessibility', href: '/accessibility', description: 'ADA compliance' },
      { label: 'Student Handbook', href: '/handbook', description: 'Policies and procedures' },
    ],
  },
];

void itemsFrom;
void canonicalRoutes;
