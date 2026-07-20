/**
 * Centralized organization information.
 * Use this instead of hardcoding contact details across pages.
 */

import { PLATFORM_DEFAULTS } from './platform-config';

export const organization = {
  phone: '(317) 314-3757',
  email: 'info@elevateforhumanity.org',
  address: '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240',
  hours: {
    weekdays: 'Monday–Friday, 8:00 a.m.–6:00 p.m. ET',
    saturday: 'Saturday, 9:00 a.m.–1:00 p.m. ET',
  },
  appointmentOnly: true,
  calendly: 'https://calendly.com/elevate4humanityedu',
};

export const supportEmail = PLATFORM_DEFAULTS.supportEmail;
export const supportPhone = PLATFORM_DEFAULTS.supportPhone;
