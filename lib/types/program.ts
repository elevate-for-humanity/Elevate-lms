/**
 * Canonical Program types.
 *
 * Import from here — not from app/data/programs.ts.
 * DB column names use snake_case; the Program type uses camelCase for
 * backward compat with existing components. New code should use DbProgram.
 */

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  includes: string[];
  popular?: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  hours: number;
  topics: string[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface Testimonial {
  id: string;
  name: string;
  photo: string;
  program: string;
  quote: string;
  outcome: string;
}

/** Legacy camelCase shape used by marketing components */
export type Program = {
  slug: string;
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  shortDescription: string;
  longDescription: string;
  heroImage: string;
  heroImageAlt: string;
  heroVideo?: string;
  voiceoverSrc?: string;
  duration: string;
  clockHours?: number;
  schedule: string;
  delivery: string;
  credential: string;
  approvals: string[];
  fundingOptions: string[];
  highlights: string[];
  whatYouLearn: string[];
  outcomes: string[];
  requirements: string[];
  ctaPrimary: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  price?: number;
  etplProgramId?: string;
  partnerUrl?: string;
  partners?: string[];
  vendorCost?: number;
  averageSalary?: string;
  salaryRange?: string;
  jobGrowth?: string;
  curriculum?: Module[];
  faq?: FAQ[];
  testimonials?: Testimonial[];
  pricingTiers?: PricingTier[];
  examVoucherPrice?: number;
  retakeVoucherPrice?: number;
};

/** DB row shape from the `programs` table */
export interface DbProgram {
  id: string;
  slug: string;
  title: string;
  name?: string;
  description?: string;
  short_description?: string;
  long_description?: string;
  image_url?: string;
  hero_image_url?: string;
  hero_image_alt?: string;
  category?: string;
  type?: string;
  status?: string;
  is_active?: boolean;
  published?: boolean;
  display_order?: number;
  duration_weeks?: number;
  clock_hours?: number;
  credential?: string;
  wioa_approved?: boolean;
  funding_tags?: string[];
  created_at?: string;
  updated_at?: string;
}
