import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Canonical public contact information for Elevate for Humanity.
// Public pages should import from this module instead of hardcoding contact data.
export const CONTACT_INFO = {
  phone: {
    display: PLATFORM_DEFAULTS.supportPhone,
    tel: '+13173143757',
  },

  email: {
    general: 'info@elevateforhumanity.org',
    support: 'info@elevateforhumanity.org',
    partnerships: 'info@elevateforhumanity.org',
  },

  address: {
    street: '120 E Market St, Suite 930',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46204',
    full: '120 E Market St, Suite 930, Indianapolis, IN 46204',
  },

  hours: {
    office: 'Monday-Friday, 9:00 AM - 5:00 PM EST',
    aiReceptionist: '24/7 - Always Available',
  },

  social: {
    facebook: 'https://www.facebook.com/61578240192934/',
    instagram: 'https://instagram.com/elevateforhumanity',
    linkedin: 'https://www.linkedin.com/in/elevate-for-humanity-b5a2b3339/',
  },
};

export function formatPhone(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}

export function getTelLink(phone: string): string {
  return `tel:${phone.replace(/\D/g, '')}`;
}
