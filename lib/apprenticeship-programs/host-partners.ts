/**
 * Featured host / training partners shown on marketing pages.
 * Keep this public-facing dataset limited to verified business contact details.
 */
export type FeaturedHostPartnerMedia = {
  src: string;
  alt: string;
  kind?: 'photo' | 'flyer' | 'video';
  /** Optional presentation speed for a shop tour. */
  playbackRate?: number;
};

export type FeaturedHostPartner = {
  slug: string;
  name: string;
  dba?: string;
  businessType?: 'BarberShop' | 'HairSalon';
  city: string;
  state: string;
  zip: string;
  address: string;
  programs: string[];
  note?: string;
  marketingBlurb?: string;
  media?: FeaturedHostPartnerMedia[];
  resourceUrl?: string;
  resourceLabel?: string;
  websiteUrl?: string;
  websiteLabel?: string;
  bookingUrl?: string;
  socialUrl?: string;
  socialLabel?: string;
  onlineListingUrl?: string;
  onlineListingLabel?: string;
  phone?: string;
};

export const FEATURED_BEAUTY_HOST_PARTNERS: FeaturedHostPartner[] = [
  {
    slug: 'kountry-kutz-barbershop',
    name: 'Kountry Kutz Barbershop',
    businessType: 'BarberShop',
    city: 'New Palestine',
    state: 'IN',
    zip: '46163',
    address: '56 W Main St, Suite A',
    phone: '(463) 710-6199',
    programs: ['barber-apprenticeship'],
    note: 'Approved barber apprenticeship host shop in downtown New Palestine.',
    marketingBlurb:
      'A family-oriented Main Street barbershop serving New Palestine with classic cuts, modern grooming, and an apprenticeship training environment.',
    media: [
      {
        src: '/images/partners/kountry-kutz/interior-empty.webp',
        alt: 'Kountry Kutz Barbershop interior and apprenticeship training stations',
        kind: 'photo',
      },
      {
        src: '/images/partners/kountry-kutz/interior-active.webp',
        alt: 'Barbers and clients inside Kountry Kutz Barbershop in New Palestine',
        kind: 'photo',
      },
      {
        src: '/videos/partners/kountry-kutz/shop-tour.mp4',
        alt: 'Guided interior tour of Kountry Kutz Barbershop',
        kind: 'video',
        playbackRate: 0.9,
      },
      {
        src: '/images/partners/kountry-kutz-apprenticeship-flyer.webp',
        alt: 'Kountry Kutz approved barber apprenticeship site announcement',
        kind: 'flyer',
      },
    ],
    websiteUrl: 'https://kountrykutzbarbershop.com',
    websiteLabel: 'Visit Kountry Kutz website',
    socialUrl: 'https://linktr.ee/kountrykutz',
    socialLabel: 'Photos, video & social',
  },
  {
    slug: 'cals-kutz-studio',
    name: 'Cals Kutz Studio',
    businessType: 'BarberShop',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46268',
    address: '6240 La Pas Trl',
    phone: '(317) 201-4841',
    programs: ['barber-apprenticeship'],
    note: 'Indianapolis barber studio and approved apprenticeship host shop.',
    marketingBlurb:
      'A full-service Indianapolis barber studio offering precision cuts, grooming, hair-loss consultation, and professional mentorship in a working shop environment.',
    media: [
      {
        src: '/images/partners/cals-kutz-confidence-restored.webp',
        alt: 'Cals Kutz Studio Confidence Restored hair replacement promotion',
        kind: 'flyer',
      },
    ],
    websiteUrl: 'https://booksy.com/en-us/211056_cal-s-kutz-studio_barber-shop_19577_indianapolis',
    websiteLabel: 'Book / view Cals Kutz online',
    socialUrl: 'https://www.instagram.com/calskutzstudio/',
    socialLabel: 'View Cals Kutz photos',
  },
  {
    slug: 'razors-image-barbershop',
    name: "Razor's Image Barbershop",
    businessType: 'BarberShop',
    city: 'Bloomington',
    state: 'IN',
    zip: '47408',
    address: '155 S Kingston Dr',
    phone: '(812) 287-7166',
    programs: ['barber-apprenticeship'],
    note: 'Approved barber apprenticeship host shop in Bloomington.',
    marketingBlurb:
      'A multicultural Bloomington barbershop focused on professional grooming, customer service, hair and scalp care, and hands-on barber development.',
    media: [
      {
        src: '/images/partners/razors-image-logo.jpg',
        alt: "Razor's Image Barbershop official logo",
        kind: 'photo',
      },
      {
        src: '/images/partners/razors-image-storefront-2026.jpg',
        alt: "Razor's Image Barbershop storefront in Bloomington, Indiana",
        kind: 'photo',
      },
      {
        src: '/images/partners/razors-image-apprenticeship-flyer.webp',
        alt: "Original Razor's Image Barber Apprenticeship Program artwork",
        kind: 'flyer',
      },
    ],
    resourceUrl:
      'https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:8be7070f-ef4e-42b8-b646-1806801ac9b3',
    resourceLabel: "View Razor's Image apprenticeship document",
    websiteUrl: 'https://razorsimage.com',
    websiteLabel: "Visit Razor's Image website",
    bookingUrl: 'https://razorsimage.com/schedule-now/',
    socialUrl: 'https://www.instagram.com/razors.image/',
    socialLabel: "View Razor's Image photos",
  },
  {
    slug: 'b-52s-barber-shop',
    name: "B-52's Barber Shop LLC",
    dba: 'B-52s Barbershop',
    businessType: 'BarberShop',
    city: 'New Castle',
    state: 'IN',
    zip: '47362',
    address: '314 Parkview Dr, Suite C',
    phone: '(765) 374-9869',
    programs: ['barber-apprenticeship'],
    note: 'Traditional New Castle barbershop and apprenticeship host shop.',
    marketingBlurb:
      'A traditional New Castle barbershop known for classic barber services including haircuts, razor line-ups, fades, and straight-razor shaves.',
    onlineListingUrl: 'https://www.bestprosintown.com/in/new-castle/b-52s-barber-shop-/',
    onlineListingLabel: 'View B-52s shop profile & photos',
  },
  {
    slug: 'style-and-scissor-salon',
    name: 'Style and Scissor Salon',
    dba: 'Style and Scissor Salon & Barber',
    businessType: 'HairSalon',
    city: 'Sullivan',
    state: 'IN',
    zip: '47882',
    address: '10 E Washington St',
    phone: '(812) 638-2090',
    programs: ['cosmetology-apprenticeship'],
    note: 'Sullivan host salon partner supporting the cosmetology apprenticeship pathway.',
    marketingBlurb:
      'A community salon and barber shop in downtown Sullivan offering hair services and traditional barbering in a local, client-focused setting.',
    media: [
      {
        src: '/images/partners/style-and-scissor-salon/contact-card.webp',
        alt: 'Style and Scissor Salon contact card for owner Cori Meid',
        kind: 'photo',
      },
      {
        src: '/images/partners/style-and-scissor-salon/logo.webp',
        alt: 'Style and Scissor Salon scissors and comb logo',
        kind: 'photo',
      },
      {
        src: '/images/partners/style-and-scissor-salon/pink-nail-work.webp',
        alt: 'Pink nail designs completed at Style and Scissor Salon',
        kind: 'photo',
      },
      {
        src: '/images/partners/style-and-scissor-salon/portfolio-nail-work.webp',
        alt: 'Nail art portfolio from Style and Scissor Salon',
        kind: 'photo',
      },
      {
        src: '/images/partners/style-and-scissor-salon/melissas-nails.webp',
        alt: 'Melissa nail designs from Style and Scissor Salon',
        kind: 'photo',
      },
    ],
    onlineListingUrl:
      'https://www.fresha.com/pl/lvp/style-and-scissor-salon-west-hopewell-street-farmersburg-l1E0B7',
    onlineListingLabel: 'View Style and Scissor details',
  },
  {
    slug: 'generations-hair-llc',
    name: 'Generations Hair LLC DBA Generations Wedding Co',
    businessType: 'HairSalon',
    city: 'Martinsville',
    state: 'IN',
    zip: '46151',
    address: '2005 Deer Lake Dr',
    programs: ['cosmetology-apprenticeship'],
    note: 'Published cosmetology apprenticeship host site in Martinsville.',
    marketingBlurb:
      'An independent Martinsville hair business located inside Cat Eye Collective and participating in the Elevate apprenticeship host-shop network.',
    media: [
      {
        src: '/images/partners/generations-hair/color-transformation.webp',
        alt: 'Generations Hair LLC dimensional color transformation',
        kind: 'photo',
      },
      {
        src: '/images/partners/generations-hair/dimensional-color.webp',
        alt: 'Generations Hair LLC dimensional brunette and blonde color work',
        kind: 'photo',
      },
      {
        src: '/images/partners/generations-hair/salon-service.webp',
        alt: 'Generations Hair LLC stylist providing a supervised salon service',
        kind: 'photo',
      },
      {
        src: '/images/partners/generations-hair/stylist-at-work.webp',
        alt: 'Generations Hair LLC stylist working with a salon guest',
        kind: 'photo',
      },
      {
        src: '/images/partners/generations-hair/cutting.webp',
        alt: 'Generations Hair Co cutting portfolio',
        kind: 'flyer',
      },
      {
        src: '/images/partners/generations-hair/brunettes.webp',
        alt: 'Generations Hair Co brunette color portfolio',
        kind: 'flyer',
      },
      {
        src: '/images/partners/generations-hair/extensions.webp',
        alt: 'Generations Hair Co extensions portfolio',
        kind: 'flyer',
      },
      {
        src: '/images/partners/generations-hair/blondes.webp',
        alt: 'Generations Hair Co blonde color portfolio',
        kind: 'flyer',
      },
      {
        src: '/images/partners/generations-hair/vivids.webp',
        alt: 'Generations Hair Co vivid color portfolio',
        kind: 'flyer',
      },
      {
        src: '/images/partners/generations-hair/reds-coppers.webp',
        alt: 'Generations Hair Co reds and coppers portfolio',
        kind: 'flyer',
      },
      {
        src: '/images/partners/generations-hair/special-event-styling.webp',
        alt: 'Generations Hair Co special event and bridal styling portfolio',
        kind: 'flyer',
      },
      {
        src: '/images/partners/generations-hair/look-book.webp',
        alt: 'Generations Hair Co salon look book',
        kind: 'flyer',
      },
      {
        src: '/images/partners/generations-hair/curls.webp',
        alt: 'Generations Hair Co curls portfolio',
        kind: 'flyer',
      },
      {
        src: '/images/partners/generations-hair/brand-mark.webp',
        alt: 'Generations Hair LLC brand mark',
        kind: 'flyer',
      },
      {
        src: '/images/partners/generations-hair/highlighted-curls-card.webp',
        alt: 'Highlighted dimensional curls created by Generations Hair LLC in Martinsville, Indiana',
        kind: 'photo',
      },
    ],
    socialUrl: 'https://www.instagram.com/midwesternmanes/',
    socialLabel: 'Contact / view shop photos',
  },
  {
    slug: 'mesmerized-by-beauty-cosmetology-academy',
    name: 'Mesmerized by Beauty Cosmetology Academy',
    businessType: 'HairSalon',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46268',
    address: 'Indianapolis, IN 46268',
    programs: ['cosmetology-apprenticeship'],
    note: 'Published cosmetology apprenticeship host site in Indianapolis.',
    marketingBlurb:
      'An Indianapolis cosmetology training and host-site option in Elevate’s published apprenticeship network. Current placement capacity is confirmed during enrollment.',
  },
  {
    slug: 'salon-saloon',
    name: 'Salon Saloon LLC',
    dba: 'Salon Saloon',
    businessType: 'HairSalon',
    city: 'South Bend',
    state: 'IN',
    zip: '46637',
    address: '1740 S Bend Ave, Suite A',
    phone: '(269) 240-7923',
    programs: ['cosmetology-apprenticeship'],
    note: 'South Bend host salon partner at its current South Bend Avenue location.',
    marketingBlurb:
      'A South Bend salon offering appointment-based hair services while participating in Elevate’s growing apprenticeship host-shop network.',
    media: [
      {
        src: '/images/partners/salon-saloon/team-sign.webp',
        alt: 'Salon Saloon team in front of the salon sign',
        kind: 'photo',
      },
      {
        src: '/images/partners/salon-saloon/team-interior.webp',
        alt: 'Salon Saloon team inside the South Bend salon',
        kind: 'photo',
      },
      {
        src: '/images/partners/salon-saloon/team-studio.webp',
        alt: 'Salon Saloon team in the studio service area',
        kind: 'photo',
      },
      {
        src: '/videos/partners/salon-saloon-tour.mp4',
        alt: 'Salon Saloon team and salon tour',
        kind: 'video',
      },
    ],
    websiteUrl: 'https://tory-103460.square.site/',
    websiteLabel: 'Book / view Salon Saloon online',
  },
];

export function getFeaturedHostPartnerBySlug(slug: string) {
  return FEATURED_BEAUTY_HOST_PARTNERS.find((shop) => shop.slug === slug);
}

export const PARTNER_BRAND_ALIASES = {
  prestigeInstitute: 'Elevate Prestige Barber and Beauty Institute',
  kountryKutz: 'Kountry Kutz Barbershop',
  corinneStyles: 'Style and Scissor Salon',
  scissors: 'Style and Scissor Salon',
} as const;
