/**
 * Featured host / training partners shown on marketing pages.
 * Update when new shops are approved in admin.
 */
export type FeaturedHostPartnerMedia = {
  src: string;
  alt: string;
  kind?: 'photo' | 'flyer';
};

export type FeaturedHostPartner = {
  name: string;
  dba?: string;
  city: string;
  state: string;
  programs: string[];
  note?: string;
  media?: FeaturedHostPartnerMedia[];
  resourceUrl?: string;
  resourceLabel?: string;
  websiteUrl?: string;
  phone?: string;
};

export const FEATURED_BEAUTY_HOST_PARTNERS: FeaturedHostPartner[] = [
  {
    name: 'Kountry Kutz Barbershop',
    city: 'New Palestine',
    state: 'IN',
    programs: ['barber-apprenticeship'],
    note: 'DOL-registered host barbershop partner.',
    media: [
      {
        src: '/images/partners/kountry-kutz-interior.webp',
        alt: 'Interior of Kountry Kutz Barbershop with barber stations',
        kind: 'photo',
      },
      {
        src: '/images/partners/kountry-kutz-apprenticeship-flyer.webp',
        alt: 'Kountry Kutz barber apprenticeship site announcement',
        kind: 'flyer',
      },
    ],
  },
  {
    name: "Cal's Kutz Studio",
    city: 'Indianapolis',
    state: 'IN',
    programs: ['barber-apprenticeship'],
    media: [
      {
        src: '/images/partners/cals-kutz-confidence-restored.webp',
        alt: "Cal's Kutz Studio Confidence Restored hair replacement promotion",
        kind: 'flyer',
      },
    ],
  },
  {
    name: 'Razors Image Barbershop',
    city: 'Bloomington',
    state: 'IN',
    programs: ['barber-apprenticeship'],
    note: 'Approved barber apprenticeship host shop.',
    media: [
      {
        src: '/images/partners/razors-image-storefront.webp',
        alt: "Razor's Image Barbershop storefront in Bloomington, Indiana",
        kind: 'photo',
      },
      {
        src: '/images/partners/razors-image-apprenticeship-flyer.webp',
        alt: "Razor's Image barber apprenticeship program flyer",
        kind: 'flyer',
      },
    ],
    resourceUrl: 'https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:8be7070f-ef4e-42b8-b646-1806801ac9b3',
    resourceLabel: "View Razor's Image document",
    websiteUrl: 'https://razorsimage.com',
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
    programs: [
      'barber-apprenticeship',
      'cosmetology-apprenticeship',
      'nail-technician-apprenticeship',
    ],
    note: '10 E Washington St, Sullivan, IN 47882 — host salon partner.',
  },
  {
    name: 'Generations Hair LLC',
    city: 'Martinsville',
    state: 'IN',
    programs: ['barber-apprenticeship'],
    note: 'Located inside Cat Eye Collective — 134 N Sycamore St, Martinsville, IN 46151.',
  },
  {
    name: 'Salon Saloon LLC',
    dba: 'Salon Saloon',
    city: 'South Bend',
    state: 'IN',
    programs: ['barber-apprenticeship'],
    note: '1740 S Bend Ave., Suite 1, South Bend, IN 46637.',
    phone: '(269) 240-7923',
  },
];

export const PARTNER_BRAND_ALIASES = {
  prestigeInstitute: 'Elevate Prestige Barber and Beauty Institute',
  kountryKutz: 'Kountry Kutz Barbershop',
  corinneStyles: 'Style and Scissor Salon',
  scissors: 'Style and Scissor Salon',
} as const;
