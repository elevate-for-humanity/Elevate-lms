export type MediaSlot =
  | 'home_hero_primary'
  | 'home_hero_secondary'
  | 'home_strip_stats'
  | 'home_student_story'
  | 'home_employer_collage'
  | 'program_cna_hero'
  | 'program_barber_hero'
  | 'program_hvac_hero'
  | 'program_cdl_hero'
  | 'program_tax_hero'
  | 'program_welding_hero'
  | 'program_culinary_hero'
  | 'program_medical_hero'
  | 'program_it_hero'
  | 'program_building_hero'
  | 'program_plumbing_hero'
  | 'training_cpr'
  | 'training_counseling';

export interface MediaConfigItem {
  slot: MediaSlot;
  imageSrc: string;
  alt: string;
  category?: string;
}

/**
 * SMART IMAGE PLACEMENT
 * Images are automatically matched to slots based on:
 * - Filename keywords (cna, barber, hvac, etc.)
 * - Directory structure (programs, media, etc.)
 * - Image quality (HD versions preferred)
 * - Content relevance
 */
export const mediaConfig: MediaConfigItem[] = [
  // Homepage Images - High-impact hero sections
  {
    slot: 'home_hero_primary',
    imageSrc: '/images/facilities-new/facility-1.webp',
    alt: 'Elevate for Humanity training facility at Keystone Crossing, Indianapolis',
    category: 'homepage',
  },
  {
    slot: 'home_hero_secondary',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    alt: 'Healthcare professional supporting a learner in clinical setting',
    category: 'homepage',
  },
  {
    slot: 'home_strip_stats',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp',
    alt: 'Collage representing Elevate outcomes and community impact',
    category: 'homepage',
  },
  {
    slot: 'home_student_story',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    alt: 'Graduate in professional healthcare attire after successful program completion',
    category: 'homepage',
  },
  {
    slot: 'home_employer_collage',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/training-provider-1.webp',
    alt: 'Employer and Elevate staff shaking hands, symbolizing partnership',
    category: 'homepage',
  },

  // Healthcare Programs
  {
    slot: 'program_cna_hero',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    alt: 'CNA student providing compassionate care to elderly patient',
    category: 'healthcare',
  },
  {
    slot: 'program_medical_hero',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    alt: 'Medical assistant in clinical setting with patient',
    category: 'healthcare',
  },

  // Beauty & Personal Care
  {
    slot: 'program_barber_hero',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/barber-hero.webp',
    alt: 'Barber apprentice cutting hair in modern barbershop',
    category: 'beauty',
  },

  // Skilled Trades
  {
    slot: 'program_hvac_hero',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    alt: 'HVAC technician working on rooftop air conditioning unit',
    category: 'trades',
  },
  {
    slot: 'program_welding_hero',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    alt: 'Welder in protective gear working with metal fabrication',
    category: 'trades',
  },
  {
    slot: 'program_plumbing_hero',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    alt: 'Plumber working on pipe installation',
    category: 'trades',
  },
  {
    slot: 'program_building_hero',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/building-maintenance-hero.svg',
    alt: 'Building maintenance technician at work',
    category: 'trades',
  },

  // Transportation
  {
    slot: 'program_cdl_hero',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cdl-hero.webp',
    alt: 'CDL student standing proudly in front of commercial truck',
    category: 'transportation',
  },

  // Business & Tax
  {
    slot: 'program_tax_hero',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    alt: 'Tax preparer helping family with tax return preparation',
    category: 'business',
  },
  {
    slot: 'program_it_hero',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    alt: 'IT professional working at computer workstation',
    category: 'business',
  },

  // Culinary
  {
    slot: 'program_culinary_hero',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    alt: 'Chef preparing food in professional kitchen',
    category: 'culinary',
  },

  // Training Modules
  {
    slot: 'training_cpr',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    alt: 'Students practicing CPR techniques in training session',
    category: 'training',
  },
  {
    slot: 'training_counseling',
    imageSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    alt: 'Counseling training session with instructor and students',
    category: 'training',
  },
];

export function getMediaBySlot(slot: MediaSlot) {
  return mediaConfig.find((m) => m.slot === slot);
}

export function getMediaByCategory(category: string) {
  return mediaConfig.filter((m) => m.category === category);
}

export function getAllSlots(): MediaSlot[] {
  return mediaConfig.map((m) => m.slot);
}
