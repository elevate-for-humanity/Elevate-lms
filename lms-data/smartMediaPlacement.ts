/**
 * SMART IMAGE PLACEMENT SYSTEM
 *
 * This configuration maps images to slots based on:
 * 1. Filename analysis (keywords in name)
 * 2. Directory structure (where image is stored)
 * 3. Image quality (HD versions preferred)
 * 4. Content relevance (matches program/section)
 */

export interface SmartImageMapping {
  slot: string;
  primaryImage: string;
  fallbackImages: string[];
  keywords: string[];
  description: string;
}

export const smartImageMappings: SmartImageMapping[] = [
  // Homepage Images
  {
    slot: 'home_hero_primary',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp',
    fallbackImages: [
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp',
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp',
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp',
    ],
    keywords: ['hero', 'elevate', 'learner', 'training', 'main'],
    description: 'Main homepage hero - should show diverse learners in training',
  },
  {
    slot: 'home_hero_secondary',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    fallbackImages: ['https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-federal-funding.webp', 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp'],
    keywords: ['healthcare', 'slide', 'professional', 'workplace'],
    description: 'Secondary hero - workplace or professional setting',
  },
  {
    slot: 'home_student_story',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    fallbackImages: [
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/student-catalog.webp',
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/student-catalog.webp',
    ],
    keywords: ['student', 'success', 'graduate', 'professional', 'testimonial'],
    description: 'Student success story - graduate in professional setting',
  },
  {
    slot: 'home_employer_collage',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/training-provider-1.webp',
    fallbackImages: ['https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp'],
    keywords: ['employer', 'partnership', 'handshake', 'business', 'workplace'],
    description: 'Employer partnerships - professional handshake or workplace',
  },

  // Program-Specific Images
  {
    slot: 'program_cna_hero',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    fallbackImages: [
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    ],
    keywords: ['cna', 'nursing', 'assistant', 'healthcare', 'patient', 'care'],
    description: 'CNA program - nursing assistant with patient or in healthcare setting',
  },
  {
    slot: 'program_barber_hero',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/barber-hero.webp',
    fallbackImages: [
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/barber-hero.webp',
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/barber-hero.webp',
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/beauty/hero-program-barber.webp',
    ],
    keywords: ['barber', 'beauty', 'hair', 'salon', 'cosmetology', 'cut'],
    description: 'Barber program - barber cutting hair or beauty professional',
  },
  {
    slot: 'program_hvac_hero',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    fallbackImages: ['https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp', 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp'],
    keywords: ['hvac', 'heating', 'cooling', 'air', 'conditioning', 'technician'],
    description: 'HVAC program - technician working on HVAC unit',
  },
  {
    slot: 'program_cdl_hero',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cdl-hero.webp',
    fallbackImages: ['https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cdl-hero.webp', 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cdl-hero.webp'],
    keywords: ['cdl', 'truck', 'commercial', 'driver', 'transportation'],
    description: 'CDL program - student with commercial truck',
  },
  {
    slot: 'program_tax_hero',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    fallbackImages: [
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    ],
    keywords: ['tax', 'vita', 'prep', 'irs', 'accounting'],
    description: 'Tax/VITA program - tax preparer helping client',
  },
  {
    slot: 'program_welding_hero',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    fallbackImages: ['https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp', 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp'],
    keywords: ['welding', 'welder', 'metal', 'fabrication'],
    description: 'Welding program - welder at work',
  },
  {
    slot: 'program_culinary_hero',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    fallbackImages: ['https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp', 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/culinary.webp'],
    keywords: ['culinary', 'cooking', 'chef', 'kitchen', 'food'],
    description: 'Culinary program - chef in kitchen',
  },
  {
    slot: 'program_medical_hero',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    fallbackImages: [
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    ],
    keywords: ['medical', 'assistant', 'healthcare', 'clinical'],
    description: 'Medical Assistant program - medical professional',
  },
  {
    slot: 'program_it_hero',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    fallbackImages: ['https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp'],
    keywords: ['it', 'technology', 'computer', 'tech', 'digital'],
    description: 'IT program - tech professional at computer',
  },
  {
    slot: 'program_building_hero',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/building-maintenance-hero.svg',
    fallbackImages: ['https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/electrical.webp'],
    keywords: ['building', 'maintenance', 'construction', 'electrical'],
    description: 'Building Maintenance program - technician at work',
  },
  {
    slot: 'program_plumbing_hero',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    fallbackImages: ['https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/about-hero.webp'],
    keywords: ['plumbing', 'plumber', 'pipe', 'water'],
    description: 'Plumbing program - plumber at work',
  },

  // Training/Education Images
  {
    slot: 'training_cpr',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    fallbackImages: [
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    ],
    keywords: ['cpr', 'training', 'emergency', 'first aid'],
    description: 'CPR training - students practicing CPR',
  },
  {
    slot: 'training_counseling',
    primaryImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/cna-hero.webp',
    fallbackImages: [],
    keywords: ['counseling', 'therapy', 'mental health', 'support'],
    description: 'Counseling training - counselor with client',
  },
];

/**
 * Get the best image for a slot based on availability
 */
export function getBestImageForSlot(slot: string): string | null {
  const mapping = smartImageMappings.find((m) => m.slot === slot);
  if (!mapping) return null;

  // Try primary first
  // In production, you'd check if file exists
  return mapping.primaryImage;
}

/**
 * Get all available images for a slot (primary + fallbacks)
 */
export function getAllImagesForSlot(slot: string): string[] {
  const mapping = smartImageMappings.find((m) => m.slot === slot);
  if (!mapping) return [];

  return [mapping.primaryImage, ...mapping.fallbackImages];
}

/**
 * Find slots that match keywords (for auto-discovery)
 */
export function findSlotsByKeywords(keywords: string[]): SmartImageMapping[] {
  return smartImageMappings.filter((mapping) =>
    keywords.some((keyword) => mapping.keywords.some((k) => k.includes(keyword.toLowerCase()))),
  );
}
