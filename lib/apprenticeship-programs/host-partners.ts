/**
 * Featured host / training partners shown on marketing pages.
 * Keep this public-facing dataset limited to verified business contact details.
 */
export type FeaturedHostPartnerMedia = {
  src: string;
  alt: string;
  kind?: 'photo' | 'flyer' | 'video';
  script?: string;
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
  primaryProgram?: string;
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
    slug: 'j-noelle-co', name: 'J Noelle & Co.', dba: 'J Noelle Collective', businessType: 'HairSalon',
    city: 'West Lafayette', state: 'IN', zip: '47906', address: '1020 Gemini Ln, Suite 120', phone: '(765) 413-0606',
    programs: ['cosmetology-apprenticeship'], primaryProgram: 'cosmetology-apprenticeship',
    marketingBlurb: 'A West Lafayette salon offering hair, extensions, brows, lashes, makeup, and skincare services. Explore the salon, book directly with the team, and ask Elevate about cosmetology apprenticeship placement.',
    media: [
      { src: '/images/partners/j-noelle/official-salon-2026.webp', alt: 'Styling stations and mirrors inside J Noelle Collective in West Lafayette', kind: 'photo' },
      { src: '/images/partners/j-noelle/official-brand-2026.webp', alt: 'J Noelle Collective official salon branding', kind: 'photo' },
    ],
    websiteUrl: 'https://jnoellecollective.com/', bookingUrl: 'https://www.vagaro.com/jnoelleandco',
  },

  {
    slug: 'prestige-elevation-barber-and-beauty-institute',
    name: 'Prestige Elevation Barber and Beauty Institute LLC',
    businessType: 'BarberShop',
    city: 'Indianapolis',
    state: 'IN',
    zip: '',
    address: '120 East Market Street, Suite 560',
    programs: ['barber-apprenticeship', 'cosmetology-apprenticeship'],
    primaryProgram: 'barber-apprenticeship',
    marketingBlurb: 'An Indianapolis barber and beauty business offering haircuts, beard grooming, styling and client care. Explore the shop portfolio and contact Elevate about supervised apprenticeship placement.',
    media: [
      { src: '/images/beauty/program-barber-training.webp', alt: 'Representative barber service image from Elevate’s earlier program collection', kind: 'photo' },
      { src: '/images/partners/prestige-elevation/official-portfolio-2026.jpg', alt: 'Natural iron-out bob styling artwork from Prestige Elevation’s published portfolio', kind: 'photo' },
    ],
    websiteUrl: 'https://booksy.com/en-us/1766191_prestige-elevation-barber-and-beauty-institute_barber-shop_19577_indianapolis',
    websiteLabel: 'Explore services and book with Prestige Elevation',
    bookingUrl: 'https://booksy.com/en-us/1766191_prestige-elevation-barber-and-beauty-institute_barber-shop_19577_indianapolis',
  },
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
      { src: '/videos/partners/kountry-kutz-tour.mp4', alt: 'Kountry Kutz Barbershop video introduction and tour', kind: 'video' },
      {
        src: '/images/partners/kountry-kutz/interior-empty-enhanced-2026.webp',
        alt: 'Kountry Kutz Barbershop interior and apprenticeship training stations',
        kind: 'photo',
      },
      {
        src: '/images/partners/kountry-kutz/interior-active-enhanced-2026.webp',
        alt: 'Barbers and clients inside Kountry Kutz Barbershop in New Palestine',
        kind: 'photo',
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
    slug: 'top-shelf-barber-lounge',
    name: 'Top Shelf Barber Lounge',
    businessType: 'BarberShop',
    city: 'Elkhart',
    state: 'IN',
    zip: '46514',
    address: '1600 E Bristol St',
    phone: '(574) 268-8532',
    programs: ['barber-apprenticeship'],
    note: 'Elkhart barber lounge and active apprenticeship host shop.',
    marketingBlurb:
      "An Elkhart barbershop offering fades, shape ups, beard trims, children's haircuts, shear cuts, and supervised barber apprenticeship experience.",
    media: [
      {
        src: '/images/partners/top-shelf-barber-lounge/top-shelf-precision-fade-enhanced-2026.webp',
        alt: 'Top Shelf Barber Lounge precision fade and professional barbering work',
        kind: 'photo',
      },
      {
        src: '/images/partners/top-shelf-barber-lounge/top-shelf-fade-profile-enhanced-2026.webp',
        alt: 'Top Shelf Barber Lounge clean fade and textured haircut',
        kind: 'photo',
      },
      {
        src: '/images/partners/top-shelf-barber-lounge/top-shelf-textured-crop-enhanced-2026.webp',
        alt: 'Top Shelf Barber Lounge textured crop and blended fade',
        kind: 'photo',
      },
      {
        src: '/images/partners/top-shelf-barber-lounge/top-shelf-wave-and-beard-enhanced-2026.webp',
        alt: 'Top Shelf Barber Lounge wave haircut, lineup, and beard grooming',
        kind: 'photo',
      },
      {
        src: '/images/partners/top-shelf-barber-lounge/top-shelf-modern-fringe-enhanced-2026.webp',
        alt: 'Top Shelf Barber Lounge modern fringe haircut with tapered sides',
        kind: 'photo',
      },

      {
        src: '/images/partners/top-shelf-barber-lounge/top-shelf-fade-and-beard-enhanced-2026.webp',
        alt: 'Top Shelf Barber Lounge fade haircut and full beard shaping',
        kind: 'photo',
      },
    ],
    websiteUrl: 'https://barbershopelkhart.com/',
    websiteLabel: 'Visit Top Shelf Barber Lounge',
    socialUrl: 'https://www.instagram.com/topshelfbarberlounge/',
    socialLabel: 'View Top Shelf Instagram',
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
      { src: '/images/partners/cals-kutz/cut-profile-enhanced-2026.webp', alt: 'Cal’s Kutz Studio enhanced fade and beard profile photograph', kind: 'photo' },
      { src: '/images/partners/cals-kutz/curly-cut-enhanced-2026.webp', alt: 'Cal’s Kutz Studio enhanced curly haircut photograph', kind: 'photo' },
      { src: '/images/partners/cals-kutz/beard-cut-enhanced-2026.webp', alt: 'Cal’s Kutz Studio enhanced beard and precision cut photograph', kind: 'photo' },
      { src: '/images/partners/cals-kutz/client-cut-enhanced-2026.webp', alt: 'Cal’s Kutz Studio enhanced client haircut photograph', kind: 'photo' },
      { src: '/images/partners/cals-kutz/interior-enhanced-2026.webp', alt: 'Cal’s Kutz Studio enhanced studio interior photograph', kind: 'photo' },
      { src: '/images/partners/cals-kutz/storefront-enhanced-2026.webp', alt: 'Cal’s Kutz Studio enhanced storefront photograph', kind: 'photo' },
      {
        src: '/images/partners/cals-kutz-confidence-restored.webp',
        alt: 'Cals Kutz Studio Confidence Restored hair replacement promotion',
        kind: 'flyer',
      },
    ],
    websiteUrl: 'https://booksy.com/en-us/211056_cal-s-kutz-studio_barber-shop_19577_indianapolis',
    websiteLabel: 'Book / view Cals Kutz online',
    bookingUrl: 'https://booksy.com/en-us/211056_cal-s-kutz-studio_barber-shop_19577_indianapolis',
    socialUrl: 'https://www.instagram.com/cal_kutz/',
    socialLabel: 'View Cals Kutz photos',
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
      { src: '/images/partners/style-and-scissor-salon/portfolio-nail-work-restored-2026.webp', alt: 'Patriotic and mixed nail-art portfolio — restored from Style and Scissor Salon photographs', kind: 'photo' },
      { src: '/images/partners/style-and-scissor-salon/melissas-nails-restored-2026.webp', alt: 'Three nail-service examples — restored from Style and Scissor Salon photographs', kind: 'photo' },
      { src: '/images/partners/style-and-scissor-salon/pink-nail-work-restored-2026.webp', alt: 'Pink French-tip and polished manicures — restored from Style and Scissor Salon photographs', kind: 'photo' },
      { src: '/images/partners/style-and-scissor-salon/logo.webp', alt: 'Style and Scissor Salon business logo', kind: 'photo' },
    ],
    onlineListingUrl:
      'https://www.fresha.com/pl/lvp/style-and-scissor-salon-west-hopewell-street-farmersburg-l1E0B7',
    onlineListingLabel: 'View Style and Scissor details',
  },
  {
    slug: 'generations-hair-llc',
    name: 'Generations Hair LLC DBA Generations Wedding Co',
    dba: 'Generations Hair / Cat Eye Collective',
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
        src: '/images/partners/generations-hair/premium-curls.jpg',
        alt: 'Generations Hair highlighted curls portfolio',
        kind: 'photo',
      },
      {
        src: '/images/partners/generations-hair/dimensional-color-after-enhanced-2026.webp',
        alt: 'Generations Hair LLC dimensional brunette and blonde color work',
        kind: 'photo',
      },
      {
        src: '/images/partners/generations-hair/salon-service.webp',
        alt: 'Generations Hair LLC stylist providing a supervised salon service',
        kind: 'photo',
      },
      {
        src: '/images/partners/generations-hair/stylist-at-work-enhanced-2026.webp',
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
    slug: 'mesmerized-by-beauty-cosmetology-academy-8420fefa',
    name: 'Mesmerized by Beauty Cosmetology Academy',
    city: 'Indianapolis',
    state: 'IN',
    zip: '',
    address: '120 East Market Street, Suite 560',
    programs: ['esthetician-apprenticeship', 'nail-technician-apprenticeship'],
    primaryProgram: 'esthetician-apprenticeship',
    note: 'Published downtown Indianapolis Host Shop profile for esthetics and nail apprenticeship pathways.',
    marketingBlurb: 'Mesmerized by Beauty is preparing a downtown Indianapolis location with a focus on nails and esthetics. The location is coming soon; the opening date, schedules, services and training availability will be announced after confirmation. Contact Elevate for updates and program information.',
    media: [
      {
        src: '/images/partners/mesmerized-by-beauty/downtown-nail-program.webp',
        alt: 'Mesmerized by Beauty nail apprenticeship training space in downtown Indianapolis',
        kind: 'photo',
      },
      {
        src: '/images/partners/mesmerized-by-beauty/downtown-esthetician-program.webp',
        alt: 'Mesmerized by Beauty esthetics apprenticeship training space in downtown Indianapolis',
        kind: 'photo',
      },
    ],
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
        src: '/images/partners/salon-saloon/team-commercial-2026.webp',
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
        script:
          'Welcome to Salon Saloon in South Bend, Indiana. The salon is located at 1740 South Bend Avenue, Suite A. As we move through the salon, notice the open service floor, professional styling stations, mirrors, salon chairs, product displays, and organized work areas designed for serving clients and supporting hands-on learning. Salon Saloon is a participating Elevate Cosmetology Apprenticeship Host Salon. In this real salon environment, apprentices can learn how to prepare and sanitize a station, disinfect tools, conduct a professional client consultation, evaluate hair and scalp needs, assist with shampoo and conditioning services, and build supervised skills in cutting, coloring, styling, finishing, and client care. The tour also introduces the workplace routines apprentices are expected to master, including safety, organization, communication, scheduling, and maintaining a clean professional environment between every guest. Apply through Elevate before reporting to the salon. Placement, employment, schedule, supervision, documented training hours, and enrollment approval are confirmed before training begins.',
      },
    ],
    websiteUrl: 'https://tory-103460.square.site/',
    websiteLabel: 'Book / view Salon Saloon online',
    socialUrl: 'https://www.instagram.com/salonsaloon_/',
    socialLabel: 'View Salon Saloon Instagram',
  },
];

export function getFeaturedHostPartnerBySlug(slug: string) {
  const normalized = slug.trim().toLowerCase().replace(/-[a-f0-9]{8}$/, '');
  const aliases: Record<string, string> = {
    'j-noelle-co': 'j-noelle-co',
    'style-and-scissors-salon': 'style-and-scissor-salon',
    'generations-hair-llc-dba-generations-wedding-co': 'generations-hair-llc',
    'generations-wedding-co-cat-eye-collective': 'generations-hair-llc',
  };
  const canonical = aliases[normalized] ?? normalized;
  return FEATURED_BEAUTY_HOST_PARTNERS.find((shop) => shop.slug === canonical);
}

export const PARTNER_BRAND_ALIASES = {
  prestigeInstitute: 'Elevate Prestige Barber and Beauty Institute',
  kountryKutz: 'Kountry Kutz Barbershop',
  corinneStyles: 'Style and Scissor Salon',
  scissors: 'Style and Scissor Salon',
} as const;
