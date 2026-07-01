/**
 * Featured host / training partners shown on marketing pages.
 * Update when new shops are approved in admin.
 */
export type FeaturedHostPartner = {
  name: string;
  dba?: string;
  city: string;
  state: string;
  programs: string[];
  note?: string;
};

export const FEATURED_BEAUTY_HOST_PARTNERS: FeaturedHostPartner[] = [
  {
    name: 'Elevate Prestige Barber and Beauty Institute',
    city: 'Indianapolis',
    state: 'IN',
    programs: ['barber-apprenticeship', 'cosmetology-apprenticeship'],
    note: '6331 N Keystone Ave — barber & cosmetology apprenticeships and Prestige Elevation RTI.',
  },
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
