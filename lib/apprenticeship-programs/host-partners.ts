/**
 * Featured host / training partners shown on marketing pages.
 * Update when new shops are approved in admin.
 *
 * This list is intentionally limited to currently approved public partners.
 * Historical partner aliases may remain below for non-list references/audit history.
 */
export type FeaturedHostPartner = {
  name: string;
  dba?: string;
  city: string;
  state: string;
  programs: string[];
  note?: string;
  resourceUrl?: string;
  resourceLabel?: string;
};

export const FEATURED_BEAUTY_HOST_PARTNERS: FeaturedHostPartner[] = [
  {
    name: 'Kountry Kutz Barbershop',
    city: 'New Palestine',
    state: 'IN',
    programs: ['barber-apprenticeship'],
    note: 'DOL-registered host barbershop partner.',
  },
  {
    name: "Cal's Kutz Studio",
    city: 'Indianapolis',
    state: 'IN',
    programs: ['barber-apprenticeship'],
  },
  {
    name: "B-52's Barber Shop LLC",
    city: 'New Castle',
    state: 'IN',
    programs: ['barber-apprenticeship'],
  },
  {
    name: 'Razors Image Barbershop',
    city: 'Bloomington',
    state: 'IN',
    programs: ['barber-apprenticeship'],
    note: 'Approved barber apprenticeship host shop.',
    resourceUrl: 'https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:8be7070f-ef4e-42b8-b646-1806801ac9b3',
    resourceLabel: 'View Razors Image document',
  },
  {
    name: 'Style and Scissor Salon',
    dba: 'Corinne Yvette Meid — Style and Scissor Salon',
    city: 'Sullivan',
    state: 'IN',
    programs: ['barber-apprenticeship', 'cosmetology-apprenticeship', 'nail-technician-apprenticeship'],
    note: '10 E Washington St, Sullivan, IN 47882 — host salon partner.',
  },
];

export const PARTNER_BRAND_ALIASES = {
  prestigeInstitute: 'Elevate Prestige Barber and Beauty Institute',
  kountryKutz: 'Kountry Kutz Barbershop',
  corinneStyles: 'Style and Scissor Salon',
  scissors: 'Style and Scissor Salon',
} as const;
