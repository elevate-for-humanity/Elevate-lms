import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const siteConfig = {
  name: 'Elevate for Humanity',
  url: 'https://www.elevateforhumanity.org',
  description: 'Career training, workforce pathways, and community-centered education programs.',
  phone: '' + PLATFORM_DEFAULTS.mainPhone + '',
  email: 'elevate4humanityedu@gmail.com',
  address: '120 E Market St, Suite 930, Indianapolis, IN 46204',
  hours: 'Mon–Fri 9am–5pm, Sat by appointment EST',
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
