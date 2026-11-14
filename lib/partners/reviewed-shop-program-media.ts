import { PROGRAM_SLUGS, type ProgramKey } from '@/lib/programs/host-shop-programs';

/** Reviewed 2026-11-13 against the bundled assets and existing source credits.
 * Classification controls presentation only; it never establishes shop approval.
 * Unknown uploads stay in the general shop portfolio until separately reviewed.
 * The Prestige barber image remains explicitly labeled representative imagery.
 */
export const REVIEWED_HOST_SHOP_MEDIA: ReadonlyArray<{
  shops: readonly string[];
  program: ProgramKey;
  assets: readonly string[];
}> = [
  {
    "shops": [
      "cals-kutz-studio"
    ],
    "program": "barber",
    "assets": [
      "/images/partners/cals-kutz/beard-cut-enhanced-2026.webp",
      "/images/partners/cals-kutz/client-cut-enhanced-2026.webp",
      "/images/partners/cals-kutz/curly-cut-enhanced-2026.webp",
      "/images/partners/cals-kutz/cut-profile-enhanced-2026.webp",
      "/images/partners/cals-kutz/interior-enhanced-2026.webp",
      "/images/partners/cals-kutz/storefront-enhanced-2026.webp"
    ]
  },
  {
    "shops": [
      "top-shelf-barber-lounge"
    ],
    "program": "barber",
    "assets": [
      "/images/partners/top-shelf-barber-lounge/top-shelf-fade-and-beard-enhanced-2026.webp",
      "/images/partners/top-shelf-barber-lounge/top-shelf-fade-profile-enhanced-2026.webp",
      "/images/partners/top-shelf-barber-lounge/top-shelf-modern-fringe-enhanced-2026.webp",
      "/images/partners/top-shelf-barber-lounge/top-shelf-precision-fade-enhanced-2026.webp",
      "/images/partners/top-shelf-barber-lounge/top-shelf-textured-crop-enhanced-2026.webp",
      "/images/partners/top-shelf-barber-lounge/top-shelf-wave-and-beard-enhanced-2026.webp"
    ]
  },
  {
    "shops": [
      "kountry-kutz-barbershop"
    ],
    "program": "barber",
    "assets": [
      "/images/partners/kountry-kutz/interior-active-enhanced-2026.webp",
      "/images/partners/kountry-kutz/interior-empty-enhanced-2026.webp",
      "/videos/partners/kountry-kutz-tour.mp4"
    ]
  },
  {
    "shops": [
      "salon-saloon"
    ],
    "program": "cosmetology",
    "assets": [
      "/images/partners/salon-saloon/team-commercial-2026.webp",
      "/images/partners/salon-saloon/team-interior-enhanced-2026.webp",
      "/videos/partners/salon-saloon-tour.mp4"
    ]
  },
  {
    "shops": [
      "prestige-elevation-barber-and-beauty-institute",
      "prestige-elevation"
    ],
    "program": "barber",
    "assets": [
      "/images/beauty/program-barber-training.webp"
    ]
  },
  {
    "shops": [
      "prestige-elevation-barber-and-beauty-institute",
      "prestige-elevation"
    ],
    "program": "cosmetology",
    "assets": [
      "/images/partners/prestige-elevation/official-portfolio-2026.jpg"
    ]
  },
  {
    "shops": [
      "paola-petit-studio"
    ],
    "program": "cosmetology",
    "assets": [
      "/images/partners/paola-petit/official-portfolio-1-2026.webp",
      "/images/partners/paola-petit/official-portfolio-2-2026.webp"
    ]
  },
  {
    "shops": [
      "style-and-scissor-salon",
      "style-and-scissors-salon"
    ],
    "program": "nail",
    "assets": [
      "/images/partners/style-and-scissor-salon/portfolio-nail-work-restored-2026.webp",
      "/images/partners/style-and-scissor-salon/melissas-nails-restored-2026.webp",
      "/images/partners/style-and-scissor-salon/pink-nail-work-restored-2026.webp"
    ]
  },
  {
    "shops": [
      "generations-hair-llc",
      "generations-hair-llc-dba-generations-wedding-co",
      "generations-wedding-co-cat-eye-collective"
    ],
    "program": "cosmetology",
    "assets": [
      "/images/partners/generations-hair/dimensional-color-after-enhanced-2026.webp",
      "/images/partners/generations-hair/dimensional-color-before-enhanced-2026.webp",
      "/images/partners/generations-hair/stylist-at-work-enhanced-2026.webp"
    ]
  },
  {
    "shops": [
      "j-noelle-co"
    ],
    "program": "cosmetology",
    "assets": [
      "/images/partners/j-noelle/official-salon-2026.webp"
    ]
  },
  {
    "shops": [
      "dbo-hair-studios"
    ],
    "program": "cosmetology",
    "assets": [
      "/images/host-shops/dbo-hair-studios/evelyn.webp",
      "/images/host-shops/dbo-hair-studios/team-portrait-2.webp",
      "/images/host-shops/dbo-hair-studios/team-portrait-3.webp"
    ]
  },
  {
    "shops": [
      "executivecutz"
    ],
    "program": "barber",
    "assets": [
      "/images/host-shops/executivecutz/interior-1.webp",
      "/images/host-shops/executivecutz/interior-2.webp",
      "/images/host-shops/executivecutz/interior-3.webp",
      "/images/host-shops/executivecutz/interior-4.webp",
      "/images/host-shops/executivecutz/interior-5.webp"
    ]
  },
  {
    "shops": [
      "studio-phresh",
      "studio-phresh-llc"
    ],
    "program": "cosmetology",
    "assets": [
      "/images/host-shops/studio-phresh/braids-enhanced-2026.webp"
    ]
  },
  {
    "shops": [
      "barbershop-32"
    ],
    "program": "barber",
    "assets": [
      "/images/host-shops/barbershop-32/official-barber-service-2026.webp",
      "/images/host-shops/barbershop-32/official-chair-2026.webp"
    ]
  },
  {
    "shops": [
      "hair-haven-extension-lounge"
    ],
    "program": "cosmetology",
    "assets": [
      "/images/host-shops/hair-haven/official-pink-color-2026.webp"
    ]
  },
  {
    "shops": [
      "b-52s-barber-shop",
      "b-52-s-barber-shop-llc"
    ],
    "program": "barber",
    "assets": [
      "/images/partners/b52s-interior-enhanced-2026.webp"
    ]
  }
];

export function isReviewedShopProgramMedia(slug: string, asset: string, program: string): boolean {
  const shop = slug.trim().toLowerCase().replace(/-[a-f0-9]{8}$/, '');
  let path: string;
  try {
    const url = new URL(asset, 'https://www.elevateforhumanity.org');
    if (!['www.elevateforhumanity.org', 'elevateforhumanity.org'].includes(url.hostname)) return false;
    path = url.pathname;
  } catch { return false; }
  return REVIEWED_HOST_SHOP_MEDIA.some(entry =>
    entry.shops.includes(shop) && PROGRAM_SLUGS[entry.program] === program && entry.assets.includes(path),
  );
}
