/**
 * MEDIA REGISTRY
 *
 * 🔴 IMPORTANT FOR ELIZABETH:
 * - Put your REAL image paths here (full resolution, crystal clear).
 * - These paths should be under /public, for example:
 *   /media/home/hero-students-1.jpg
 *   /media/home/hero-students-2.jpg
 *   /media/programs/cna-skills-lab.jpg
 *
 * You DO NOT need to touch components once this is set.
 */

export interface HeroImage {
  id: string;
  src: string;
  alt: string;
  headline: string;
  subheadline: string;
  ctaLabel?: string;
  ctaHref?: string;
  badge?: string;
}

export interface ProgramHighlightImage {
  id: string;
  src: string;
  alt: string;
  programId?: string;
  label: string;
  description: string;
}

export interface SuccessStoryImage {
  id: string;
  src: string;
  alt: string;
  name: string;
  outcome: string;
  quote: string;
}

/**
 * HOME HERO – TOP OF HOMEPAGE
 * At least 1–3 images for a nice rotating carousel.
 */
export const homeHeroImages: HeroImage[] = [
  {
    id: 'home-hero-1',
    src: '/images/facilities-new/facility-1.webp',
    alt: 'Elevate For Humanity training facility with Keystone Crossing location',
    headline: 'Earn While You Learn, Close Your Wage Gap',
    subheadline:
      'High-demand career training, real credentials, and paid experience through JRI, WRG, WEX, OJT, and apprenticeships.',
    ctaLabel: 'Explore Programs',
    ctaHref: '/programs',
    badge: 'State & Employer-Aligned',
  },
  {
    id: 'home-hero-2',
    src: '/images/artlist/hero-training-3.webp',
    alt: 'Students learning practical career skills in training programs',
    headline: 'Hands-On Apprenticeships & Industry Pathways',
    subheadline:
      'Barber, Nails, CNA, HVAC, Building Tech, CDL, IT Support, Tax/VITA and more, built with real industry partners.',
    ctaLabel: 'See Apprenticeship Pathways',
    ctaHref: '/programs',
    badge: 'Job-Ready Pathways',
  },
  {
    id: 'home-hero-3',
    src: '/images/students-new/student-2.webp',
    alt: 'Student working while studying on a laptop',
    headline: 'Online + In-Person Support, Wrapped Around You',
    subheadline:
      'Blend self-paced modules, live labs, and AI instructors that help you stay on track, not stuck.',
    ctaLabel: 'Start Your Intake',
    ctaHref: '/apply',
    badge: 'Wraparound Support',
  },
];

/**
 * SECONDARY HERO / STRIP – further down homepage
 * Think of this as the "program categories" visual strip.
 */
export const homeSecondaryStripImages: ProgramHighlightImage[] = [
  {
    id: 'strip-barber-beauty',
    src: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/efh-barber-hero.webp',
    alt: 'Barber and beauty apprentices practicing',
    programId: 'barber',
    label: 'Barber & Beauty Apprenticeships',
    description:
      'FREE apprenticeship - earn hours in real shops while completing Milady-aligned coursework and career coaching.',
  },
  {
    id: 'strip-healthcare-cna',
    src: '/images/programs-new/program-1.webp',
    alt: 'CNA students practicing skills',
    programId: 'certified-nursing-assistant',
    label: 'Healthcare & CNA',
    description:
      'CNA and healthcare pathways aligned to Choice Medical Institute and state requirements.',
  },
  {
    id: 'strip-hvac-building',
    src: '/images/artlist/hero-training-5.webp',
    alt: 'Students engaged in hands-on career training',
    programId: 'hvac-technician',
    label: 'HVAC & Building Tech',
    description:
      'Earn-while-you-learn maintenance and HVAC pathways with real property and facilities partners.',
  },
  {
    id: 'strip-tax-it',
    src: '/images/students-new/student-1.webp',
    alt: 'Learners working on laptops',
    programId: 'tax-vita',
    label: 'Tax, VITA & IT Support',
    description:
      'Tax/VITA training with IRS and Intuit resources, plus IT Helpdesk and customer service tracks.',
  },
];

/**
 * SUCCESS STORY IMAGES – for "Success Stories" or "Impact" section.
 */
export const successStoryImages: SuccessStoryImage[] = [
  {
    id: 'success-1',
    src: '/images/students-new/student-1.webp',
    alt: 'Healthcare student in training',
    name: 'Sample Graduate – Healthcare',
    outcome: 'Hired full-time in healthcare',
    quote:
      'Elevate helped me go from stuck to a stable CNA job with a clear path to become an LPN.',
  },
  {
    id: 'success-2',
    src: '/images/students-new/student-2.webp',
    alt: 'Apprentice in training program',
    name: 'Sample Apprentice – Barber',
    outcome: 'Completed apprenticeship & building clientele',
    quote:
      'I was able to earn money in the shop while finishing my hours. Elevate kept my paperwork and hours straight.',
  },
  {
    id: 'success-3',
    src: '/images/students-new/student-3.webp',
    alt: 'Student working on computer',
    name: 'Sample Learner – Tax & IT',
    outcome: 'Seasonal tax experience & IT support role',
    quote:
      'The combination of VITA training and tech coursework gave me real experience and a resume that gets callbacks.',
  },
];

/**
 * 🔴 ACTION FOR YOU:
 * Replace the src paths above with EXACT paths to your real photos in /public.
 * You can add/remove items, but keep the structure.
 */
