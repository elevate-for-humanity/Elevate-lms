/**
 * Centralized organization information.
 * 
 * IMPORTANT: This is the SINGLE SOURCE OF TRUTH for all contact information.
 * 
 * Use this instead of hardcoding contact details across pages.
 * Import from this module wherever organization info is needed.
 * 
 * Address hierarchy:
 * - adminAddress: Administrative office (correspondence, documents)
 * - testingAddress: Testing center location
 * - trainingAddresses: Partner locations for hands-on training
 * 
 * DO NOT add hardcoded addresses to individual files.
 */

import { PLATFORM_DEFAULTS } from './platform-config';

export const organization = {
  // Main contact
  phone: '(317) 314-3757',
  email: 'info@elevateforhumanity.org',
  
  // Administrative office address (for correspondence and enrollment)
  address: '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240',
  
  // Testing center address
  testingAddress: '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240',
  
  // Training locations vary by program - see partner/training-sites page
  // Barber/cosmetology: licensed partner barbershops
  // Healthcare: partner clinical facilities  
  // CDL: partner driving schools
  // Trades: employer OJT sites
  
  hours: {
    weekdays: 'Monday–Friday, 8:00 a.m.–6:00 p.m. ET',
    saturday: 'Saturday, 9:00 a.m.–1:00 p.m. ET',
  },
  appointmentOnly: true,
  calendly: 'https://calendly.com/elevate4humanityedu',
  
  // Approvals and registrations
  approvals: {
    jobReadyIndy: {
      status: 'Approved Provider',
      description: 'Approved Job Ready Indy training provider serving justice-involved individuals',
    },
    registeredApprenticeship: {
      status: 'Registered Sponsor',
      rapidsId: '2025-IN-132301',
      sponsorName: '2Exclusive LLC-S',
      description: 'DOL Registered Apprenticeship Sponsor',
    },
    etpl: {
      status: 'Listed Training Provider',
      description: 'Listed on Indiana Eligible Training Provider List (ETPL)',
      verifyUrl: 'https://intraining.dwd.in.gov',
    },
  },
  
  // Legal entity
  legalName: '2Exclusive LLC-S',
  dbaName: 'Elevate for Humanity Career & Technical Institute',
  
  // County and region
  county: 'Marion County, Indiana',
  region: 'Central Indiana',
};

export const supportEmail = PLATFORM_DEFAULTS.supportEmail;
export const supportPhone = PLATFORM_DEFAULTS.supportPhone;

// DEPRECATED: Direct imports of these addresses are discouraged.
// Use the organization object from this file instead.
export const ADMIN_ADDRESS = organization.address;
export const TESTING_ADDRESS = organization.testingAddress;
