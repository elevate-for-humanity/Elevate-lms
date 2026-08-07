/**
 * Centralized organization information.
 *
 * SINGLE SOURCE OF TRUTH for public organization/contact information.
 * Do not hardcode addresses, phone numbers, hours, or approval descriptions in pages.
 */

import { PLATFORM_DEFAULTS } from './platform-config';

export const organization = {
  phone: PLATFORM_DEFAULTS.supportPhone,
  email: 'info@elevateforhumanity.org',

  // Canonical administrative/contact address
  address: '120 E Market St, Suite 930, Indianapolis, IN 46204',

  // Testing is scheduled by program/provider; use the public testing page for current location details.
  testingAddress: '120 E Market St, Suite 930, Indianapolis, IN 46204',

  hours: {
    weekdays: 'Monday–Friday, 9:00 a.m.–5:00 p.m. ET',
    saturday: 'By appointment',
  },
  appointmentOnly: true,
  calendly: 'https://calendly.com/elevate4humanityedu',

  approvals: {
    jobReadyIndy: {
      status: 'Approved Provider',
      description:
        'Approved Job Ready Indy provider supporting employability-skill development and workforce readiness. Occupational training funding and participant eligibility are determined separately by the applicable workforce program or funding authority.',
    },
    registeredApprenticeship: {
      status: 'Registered Sponsor',
      rapidsId: '2025-IN-132301',
      sponsorName: '2Exclusive LLC-S',
      description: 'U.S. Department of Labor Registered Apprenticeship Sponsor',
    },
    etpl: {
      status: 'Listed Training Provider',
      description:
        'Indiana INTraining/ETPL-listed provider. Eligibility and funding status are program-specific and subject to current agency records.',
      verifyUrl: 'https://intraining.dwd.in.gov',
    },
  },

  legalName: '2Exclusive LLC-S',
  dbaName: 'Elevate for Humanity Career & Technical Institute',
  county: 'Marion County, Indiana',
  region: 'Central Indiana',
} as const;

export const supportEmail = PLATFORM_DEFAULTS.supportEmail;
export const supportPhone = PLATFORM_DEFAULTS.supportPhone;

export const ADMIN_ADDRESS = organization.address;
export const TESTING_ADDRESS = organization.testingAddress;
