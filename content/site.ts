import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const siteConfig = {
  name: 'Elevate for Humanity',
  url: 'https://www.elevateforhumanity.org',
  description: 'Career training, workforce pathways, and community-centered education programs.',
  phone: '' + PLATFORM_DEFAULTS.supportPhone + '',
  email: 'info@elevateforhumanity.org',
  address: 'Indianapolis, IN',
  hours: 'Mon–Fri 8am–6pm, Sat 9am–1pm EST',
  nav: [
    { label: 'Programs', href: '/programs' },
    { label: 'Career Training', href: '/career-training' },
    { label: 'Community Services', href: '/community-services' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  handoff: {
    apply: '/apply',
    login: '/login',
    checkout: '/store',
    enrollment: '/enrollment',
    lms: 'https://app.elevateforhumanity.org/lms/courses',
    studentPortal: 'https://app.elevateforhumanity.org/lms/dashboard',
  },
};
