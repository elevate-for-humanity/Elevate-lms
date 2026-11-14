import { createClient } from '@/lib/supabase/server';

export interface CategoryData {
  title: string;
  description: string;
  badges?: Array<{ text: string; color: string }>;
  heroGradient?: string;
  duration?: string;
  cost?: string;
  format?: string;
  outcome?: string;
  targetAudience?: string[];
  ctaPrimary?: { text: string; href: string };
  ctaSecondary?: { text: string; href: string };
}

export const categoryData: Record<string, CategoryData> = {
  healthcare: {
    title: 'Healthcare Programs',
    description: 'CNA, Medical Assistant, Phlebotomy, and Home Health Aide training programs',
    badges: [
      { text: 'Free with funding', color: 'green' },
      { text: 'Hybrid', color: 'blue' },
    ],
    heroGradient: 'from-blue-900 via-purple-900 to-black',
    duration: '4-12 weeks',
    cost: 'Free with funding when eligible',
    format: 'Hybrid',
    outcome: 'CNA, MA, Phlebotomy certification',
    targetAudience: [
      'Individuals seeking career change or advancement',
      'No prior experience required for most programs',
      'Compassionate individuals interested in helping others',
      'Those seeking stable, in-demand careers',
    ],
  },
  'skilled-trades': {
    title: 'Skilled Trades Programs',
    description: 'HVAC, Electrical, Plumbing, and Construction training programs',
    badges: [
      { text: 'Free with funding', color: 'green' },
      { text: 'Hands-on', color: 'orange' },
    ],
    heroGradient: 'from-orange-900 via-red-900 to-black',
    duration: '8-16 weeks',
    cost: 'Free with funding when eligible',
    format: 'Hands-on training',
    outcome: 'Industry certifications',
    targetAudience: [
      'Individuals who enjoy working with their hands',
      'Those seeking high-paying careers',
      'People interested in construction and building',
      'Career changers looking for stable work',
    ],
  },
  'tax-entrepreneurship': {
    title: 'Tax & Entrepreneurship Programs',
    description: 'Tax preparation, bookkeeping, and small business training',
    badges: [
      { text: 'Free with funding', color: 'green' },
      { text: 'Remote', color: 'blue' },
    ],
    heroGradient: 'from-green-900 via-teal-900 to-black',
    duration: '6-12 weeks',
    cost: 'Free with funding when eligible',
    format: 'Remote/Hybrid',
    outcome: 'Tax preparer certification, business skills',
    targetAudience: [
      'Aspiring entrepreneurs',
      'Those interested in tax preparation',
      'People seeking flexible, remote work',
      'Individuals with strong attention to detail',
    ],
  },
  'business-financial': {
    title: 'Business & Financial Programs',
    description: 'Business administration, accounting, and financial services training',
    badges: [
      { text: 'Free with funding', color: 'green' },
      { text: 'Professional', color: 'purple' },
    ],
    heroGradient: 'from-purple-900 via-indigo-900 to-black',
    duration: '8-16 weeks',
    cost: 'Free with funding when eligible',
    format: 'Hybrid',
    outcome: 'Professional certifications',
    targetAudience: [
      'Career professionals seeking advancement',
      'Those interested in business operations',
      'People with strong analytical skills',
      'Individuals seeking office-based careers',
    ],
  },
  'cdl-transportation': {
    title: 'CDL & Transportation Programs',
    description: "Commercial driver's license and transportation industry training",
    badges: [
      { text: 'Free with funding', color: 'green' },
      { text: 'High demand', color: 'orange' },
    ],
    heroGradient: 'from-gray-900 via-slate-900 to-black',
    duration: '4-8 weeks',
    cost: 'Free with funding when eligible',
    format: 'Hands-on training',
    outcome: 'CDL certification',
    targetAudience: [
      'Those seeking high-paying careers',
      'People who enjoy driving',
      'Individuals seeking independence',
      'Career changers looking for stability',
    ],
  },
};

export async function getCategoryPrograms(category: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('programs')
    .select(
      'id, slug, title, description, short_description, image_url, hero_image_url, category, is_active',
    )
    .eq('is_active', true)
    .ilike('category', `%${category}%`)
    .order('title');
  return data ?? [];
}
