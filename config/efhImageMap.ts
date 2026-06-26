import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const efhImageMap = {
  homeHeroTop: {
    label: 'Top homepage hero banner',
    src: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp',
    alt: 'Elevate for Humanity gradient hero banner',
  },
  homeHeroSecond: {
    label: '2nd hero banner – home page',
    src: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp',
    alt: 'Program overview hero with four feature boxes',
  },
  founderBioSide: {
    label: 'Founder bio – side image',
    src: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp',
    alt: 'Elizabeth Greene seated at executive desk',
  },
  founderStandingHome: {
    label: 'Homepage founder spotlight image',
    src: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp',
    alt: 'Elizabeth Greene standing in white dress and red heels',
  },
} as const;
