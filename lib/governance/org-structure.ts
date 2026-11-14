/**
 * Public organizational structure — single source for governance pages.
 */

import { RAPIDS_SPONSOR_LABEL } from '@/lib/workforce-ids';
import { formatHeadquartersLine } from '@/lib/org-locations';
import { TEAM } from '@/data/team';

export const ORG_ENTITIES = [
  {
    name: 'Elevate for Humanity Career & Technical Institute',
    role: 'Workforce Training Provider',
    description:
      'Delivers ETPL-listed programs, credentials preparation, testing center services, and learner placement support.',
  },
  {
    name: '2Exclusive LLC-S (d/b/a Elevate for Humanity)',
    role: 'DOL Registered Apprenticeship Sponsor',
    description: `Sponsors registered apprenticeships tracked in RAPIDS. ${RAPIDS_SPONSOR_LABEL}.`,
  },
  {
    name: 'Selfish Inc. (501(c)(3))',
    role: 'Community Programs',
    description:
      'Community services including VITA free tax preparation and supportive services aligned with workforce missions.',
  },
] as const;

export const GOVERNANCE_FUNCTIONS = [
  {
    function: 'Executive leadership & strategy',
    owner: 'Elizabeth Greene — Founder & CEO',
    contact: 'info@elevateforhumanity.org',
  },
  {
    function: 'Financial operations & compliance',
    owner: 'Dr. Carlina Wilkes — Executive Director of Financial Operations & Organizational Compliance',
    contact: 'carlina@elevateforhumanity.org',
  },
  {
    function: 'Curriculum & healthcare programs',
    owner: 'Naomi Jordan — Director of Healthcare Administration',
    contact: 'naomi@elevateforhumanity.org',
  },
  {
    function: 'Enrollment & beauty industry programs',
    owner: 'Jozanna George — Director of Enrollment & Beauty Industry Programs',
    contact: 'jozanna@elevateforhumanity.org',
  },
  {
    function: 'Apprenticeship operations & RAPIDS',
    owner: 'Program Operations (see apprenticeship handbook)',
    contact: 'info@elevateforhumanity.org',
  },
  {
    function: 'Credential testing center',
    owner: 'Alberta Davis — Testing Center Coordinator & Exam Proctor',
    contact: 'alberta@elevateforhumanity.org',
  },
] as const;

export const ORG_CAPACITY = {
  leadershipTeam: TEAM.length,
  headquarters: formatHeadquartersLine(),
  deliveryModel:
    'Core staff plus contracted instructors, partner salons/shops, clinical sites, and employer hosts.',
} as const;
