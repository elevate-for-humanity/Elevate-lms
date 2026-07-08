/**
 * Hero Configuration System
 *
 * Rules:
 * 1. Every page MUST have a hero
 * 2. No gradient overlays - ever
 * 3. Images are category-owned, not page-owned
 * 4. Three variants only: full, split, illustration
 */

import type { HeroVariant, HeroHeight, HeroCTA } from '@/components/ui/HeroSection';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Video hero sources - used across the site
// Rules: No gradient overlays, text in solid container, calm motion only
// All URLs point to R2 CDN — confirmed 206 on all files listed below.
const R2 = 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos';
export const VIDEO_HEROES = {
  // Main/Marketing
  homepage: `${R2}/hero-home-fast.mp4`,
  careerServices: `${R2}/career-services-hero.mp4`,

  // Program Categories
  barber: `${R2}/barber-hero-final.mp4`,
  barberApprenticeship: `${R2}/barber-hero-final.mp4`,
  healthcare: `${R2}/cna-hero.mp4`,
  skilledTrades: `${R2}/hvac-hero-final.mp4`,
  technology: `${R2}/hero-home-fast.mp4`,

  // Government/Enterprise
  government: `${R2}/hero-home-fast.mp4`,
  workforceBoard: `${R2}/hero-home-fast.mp4`,

  // Store
  storeCourses: `${R2}/hero-home-fast.mp4`,
  storeDigital: `${R2}/hero-home-fast.mp4`,

  // LMS
  lmsCourses: `${R2}/hero-home-fast.mp4`,
} as const;

// Category-based hero image assignments
// Same category = same visual family, different specific images
export const HERO_IMAGES = {
  // Healthcare family
  healthcare: {
    cna: '/images/pages/cna-clinical.jpg',
    medicalAssistant: '/images/pages/medical-assistant-lab.webp',
    phlebotomy: '/images/pages/phlebotomy-draw.webp',
    cprFirstAid: '/images/pages/cna-patient-care.jpg',
    drugCollector: '/images/pages/healthcare-classroom.webp',
    dsp: '/images/pages/healthcare-grad.jpg',
  },

  // Trades family
  trades: {
    hvac: '/images/pages/hvac-technician.webp',
    cdl: '/images/pages/cdl-truck-highway.webp',
    welding: '/images/pages/welding-sparks.webp',
    electrical: '/images/pages/electrical.webp',
    plumbing: '/images/pages/plumbing.jpg',
    diesel: '/images/pages/hvac-tools.webp',
  },

  // Beauty/Apprenticeship family
  apprenticeship: {
    barber: '/images/pages/barber-hero-main.jpg',
    cosmetology: '/images/pages/barber-styling-hair.webp',
    esthetician: '/images/pages/barber-apprentice-learning.webp',
    nailTech: '/images/pages/barber-apprenticeship.webp',
  },

  // Technology family
  technology: {
    itSupport: '/images/pages/it-helpdesk-desk.webp',
    cybersecurity: '/images/pages/cybersecurity-screen.jpg',
    webDev: '/images/pages/technology-sector.webp',
  },

  // Business family
  business: {
    taxPrep: '/images/pages/tax-preparation.webp',
    entrepreneurship: '/images/pages/business-sector.webp',
    businessAdmin: '/images/pages/admin-business-hero.webp',
  },

  // Enterprise/Licensing family
  enterprise: {
    licensing: '/images/pages/about-hero.webp',
    whiteLabel: '/images/pages/features-hero.webp',
    partners: '/images/pages/for-employers-page-1.webp',
    government: '/images/pages/how-it-works-hero.webp',
  },

  // Marketing/General
  marketing: {
    homepage: '/images/pages/workforce-training.webp',
    programs: '/images/pages/training-classroom.webp',
    about: '/images/pages/about-hero.webp',
    careers: '/images/pages/career-counseling.jpg',
    contact: '/images/pages/contact-hero.jpg',
  },

  // LMS/Portal
  lms: {
    studentPortal: '/images/pages/training-cohort.webp',
    dashboard: '/images/pages/healthcare-classroom.webp',
    courses: '/images/pages/training-classroom.webp',
  },

  // Governance/Policy
  governance: {
    privacy: '/images/pages/about-hero.webp',
    terms: '/images/pages/features-hero.webp',
    ferpa: '/images/pages/how-it-works-hero.webp',
    accessibility: '/images/pages/contact-hero.jpg',
  },
} as const;

// Page-specific hero configurations
export interface PageHeroConfig {
  title: string;
  subtitle?: string;
  /** Image for static heroes (full/split/illustration) */
  image?: string;
  /** Video source for video heroes */
  videoSrc?: string;
  /** Poster image for video heroes */
  videoPoster?: string;
  variant: HeroVariant;
  height?: HeroHeight;
  badge?: string;
  ctaPrimary?: HeroCTA;
  ctaSecondary?: HeroCTA;
  metadata?: Array<{ label: string; value: string }>;
}

// Pre-defined hero configs for key pages
// TOP 10 PRIORITY PAGES - these get migrated first
export const PAGE_HEROES: Record<string, PageHeroConfig> = {
  // ============================================
  // PRIORITY 1: Homepage (VIDEO)
  // ============================================
  '/': {
    title: 'Free Career Training That Changes Lives',
    subtitle:
      'WIOA-funded workforce programs in healthcare, skilled trades, and technology. No cost if you qualify.',
    videoSrc: VIDEO_HEROES.homepage,
    videoPoster: '/images/pages/workforce-training.webp',
    variant: 'video',
    height: 'full',
    ctaPrimary: { label: 'Find a Program', href: '/programs' },
    ctaSecondary: { label: 'For Partners', href: '/partner' },
  },

  // ============================================
  // PRIORITY 2: Programs Index
  // ============================================
  '/programs': {
    title: 'Career Training Programs',
    subtitle:
      'Industry-recognized certifications in high-demand fields. Free for eligible participants.',
    image: '/images/pages/training-classroom.webp',
    variant: 'split',
    height: 'medium',
    ctaPrimary: { label: 'Check Eligibility', href: '/wioa-eligibility' },
    ctaSecondary: { label: 'View All Programs', href: '#programs' },
  },

  // ============================================
  // PRIORITY 3-7: Top 5 Programs
  // ============================================

  // Barber Apprenticeship (VIDEO)
  '/programs/barber-apprenticeship': {
    title: 'Barber Apprenticeship Program',
    subtitle:
      'Become a licensed barber through our USDOL-registered apprenticeship. Earn while you learn.',
    videoSrc: VIDEO_HEROES.barberApprenticeship,
    videoPoster: '/images/pages/barber-hero-main.jpg',
    variant: 'video',
    height: 'medium',
    badge: 'USDOL Registered',
    metadata: [
      { label: 'Duration', value: '2,000 hours' },
      { label: 'Format', value: 'In-Shop Training' },
      { label: 'Cost', value: 'Free if eligible' },
    ],
    ctaPrimary: { label: 'Apply Now', href: '/programs/barber-apprenticeship/apply' },
    ctaSecondary: { label: 'Find a Host Shop', href: '/programs/barber-apprenticeship/host-shops' },
  },

  // CNA Certification
  '/programs/cna': {
    title: 'CNA Certification Training',
    subtitle: 'Become a Certified Nursing Assistant in 4-6 weeks. High-demand healthcare career.',
    image: '/images/pages/cna-clinical.jpg',
    variant: 'split',
    height: 'medium',
    badge: 'WIOA Funded',
    metadata: [
      { label: 'Duration', value: '4-6 weeks' },
      { label: 'Format', value: 'Hybrid' },
      { label: 'Cost', value: 'Free if eligible' },
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=cna' },
    ctaSecondary: { label: 'Check Eligibility', href: '/wioa-eligibility' },
  },

  // Esthetician Apprenticeship
  '/programs/esthetician-apprenticeship': {
    title: 'Esthetician Apprenticeship',
    subtitle: 'Launch your skincare career through hands-on apprenticeship training.',
    image: '/images/pages/barber-apprentice-learning.webp',
    variant: 'split',
    height: 'medium',
    badge: 'State Approved',
    metadata: [
      { label: 'Duration', value: '700 hours' },
      { label: 'Format', value: 'In-Salon Training' },
      { label: 'Cost', value: 'Free if eligible' },
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=esthetician' },
    ctaSecondary: { label: 'Learn More', href: '#program-details' },
  },

  // CDL Training
  '/programs/cdl-training': {
    title: 'CDL Training Program',
    subtitle: "Get your Commercial Driver's License and start a career in transportation.",
    image: '/images/pages/cdl-truck-highway.webp',
    variant: 'split',
    height: 'medium',
    badge: 'ELDT Certified',
    metadata: [
      { label: 'Duration', value: '3-4 weeks' },
      { label: 'Format', value: 'In-Person' },
      { label: 'Cost', value: 'Free if eligible' },
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=cdl' },
    ctaSecondary: { label: 'Check Eligibility', href: '/wioa-eligibility' },
  },

  // IT Support
  '/programs/it-help-desk': {
    title: 'IT Support Training',
    subtitle: 'Certiport IT Specialist certification training. Launch your career in technology.',
    image: '/images/pages/it-helpdesk-desk.webp',
    variant: 'split',
    height: 'medium',
    badge: 'Certiport Authorized',
    metadata: [
      { label: 'Duration', value: '8-12 weeks' },
      { label: 'Format', value: 'Hybrid' },
      { label: 'Certification', value: 'Certiport IT Specialist' },
    ],
    ctaPrimary: { label: 'Apply Now', href: '/programs/it-help-desk' },
    ctaSecondary: { label: 'Check Eligibility', href: '/wioa-eligibility' },
  },

  // ============================================
  // PRIORITY 8: Apply/Enrollment
  // ============================================
  '/apply': {
    title: 'Start Your Application',
    subtitle:
      'Take the first step toward a new career. Our team will guide you through the process.',
    image: '/images/pages/healthcare-classroom.webp',
    variant: 'split',
    height: 'medium',
    badge: 'Free Training Available',
    ctaPrimary: { label: 'Begin Application', href: '#application-form' },
  },

  // ============================================
  // PRIORITY 9: Enterprise/Licensing
  // ============================================
  '/store/licenses': {
    title: 'Enterprise Licensing',
    subtitle:
      'Deploy the Elevate LMS platform for your organization. Managed infrastructure, your brand.',
    image: '/images/pages/features-hero.webp',
    variant: 'illustration',
    height: 'medium',
    ctaPrimary: { label: 'View Plans', href: '/admin/licenses' },
    ctaSecondary: { label: 'Contact Sales', href: '/contact' },
  },

  // ============================================
  // PRIORITY 10: Student Portal (LMS)
  // ============================================
  '/student-portal': {
    title: 'Student Portal',
    subtitle: 'Access your courses, track progress, and manage your training journey.',
    image: '/images/pages/training-cohort.webp',
    variant: 'split',
    height: 'compact',
  },

  // ============================================
  // ADDITIONAL KEY PAGES
  // ============================================

  // About
  '/about': {
    title: 'About ' + PLATFORM_DEFAULTS.orgName + '',
    subtitle: 'Breaking the cycle of poverty through free workforce training since 2020.',
    image: '/images/pages/about-hero.webp',
    variant: 'split',
    height: 'medium',
    ctaPrimary: { label: 'Our Mission', href: '/about/mission' },
    ctaSecondary: { label: 'Meet the Team', href: '/about/team' },
  },

  // Contact
  '/contact': {
    title: 'Contact Us',
    subtitle: "Questions about programs, enrollment, or partnerships? We're here to help.",
    image: '/images/pages/contact-hero.jpg',
    variant: 'split',
    height: 'medium',
    ctaPrimary: { label: 'Call Now', href: 'tel:3173143757' },
  },

  // Testimonials
  '/testimonials': {
    title: 'Success Stories',
    subtitle: 'Real graduates. Real careers. Real impact.',
    image: '/images/pages/healthcare-grad.jpg',
    variant: 'split',
    height: 'medium',
    ctaPrimary: { label: 'Start Your Journey', href: '/apply' },
  },

  // FERPA (Governance)
  '/policies/ferpa': {
    title: 'FERPA Privacy Policy',
    subtitle: 'How we protect student education records under federal law.',
    image: '/images/pages/how-it-works-hero.webp',
    variant: 'illustration',
    height: 'compact',
  },

  // Privacy Policy (Governance)
  '/legal/privacy': {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your information.',
    image: '/images/pages/about-hero.webp',
    variant: 'illustration',
    height: 'compact',
  },

  // ============================================
  // VIDEO HERO PAGES (Category Landings)
  // ============================================

  // Barber Category (VIDEO)
  '/programs/barber': {
    title: 'Barber Training Programs',
    subtitle:
      'Start your career in barbering with hands-on training and apprenticeship opportunities.',
    videoSrc: VIDEO_HEROES.barber,
    videoPoster: '/images/pages/barber-styling-hair.webp',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Apply Now', href: '/programs/barber-apprenticeship/apply' },
    ctaSecondary: { label: 'View Programs', href: '#programs' },
  },

  // Healthcare Category (VIDEO)
  '/programs/healthcare': {
    title: 'Healthcare Training Programs',
    subtitle: 'Launch your healthcare career with CNA, Medical Assistant, and Phlebotomy training.',
    videoSrc: VIDEO_HEROES.healthcare,
    videoPoster: '/images/pages/cna-patient-care.jpg',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=healthcare' },
    ctaSecondary: { label: 'View Programs', href: '#programs' },
  },

  // Skilled Trades Category (VIDEO)
  '/programs/skilled-trades': {
    title: 'Skilled Trades Training',
    subtitle: 'HVAC, Welding, Electrical, and CDL training for high-demand careers.',
    videoSrc: VIDEO_HEROES.skilledTrades,
    videoPoster: '/images/pages/welding-sparks.webp',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=trades' },
    ctaSecondary: { label: 'View Programs', href: '#programs' },
  },

  // Technology Category (VIDEO)
  '/programs/technology': {
    title: 'Technology Training Programs',
    subtitle: 'IT Support, Cybersecurity, and Web Development training for tech careers.',
    videoSrc: VIDEO_HEROES.technology,
    videoPoster: '/images/pages/cybersecurity-screen.jpg',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=technology' },
    ctaSecondary: { label: 'View Programs', href: '#programs' },
  },

  // Career Services (VIDEO)
  '/career-services': {
    title: 'Career Services',
    subtitle: 'Job placement, resume building, interview prep, and ongoing career support.',
    videoSrc: VIDEO_HEROES.careerServices,
    videoPoster: '/images/pages/career-counseling.jpg',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Get Started', href: '/career-services/contact' },
  },

  // Government (VIDEO)
  '/government': {
    title: 'Government Partners',
    subtitle: 'Workforce development solutions for state and local agencies.',
    videoSrc: VIDEO_HEROES.government,
    videoPoster: '/images/pages/how-it-works-hero.webp',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Partner With Us', href: '/contact' },
  },

  // Workforce Board (VIDEO)
  '/workforce-board': {
    title: 'Workforce Board Portal',
    subtitle: 'Manage participants, track outcomes, and generate compliance reports.',
    videoSrc: VIDEO_HEROES.workforceBoard,
    videoPoster: '/images/pages/workforce-training.webp',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Access Portal', href: '/workforce-board/dashboard' },
  },

  // Store - Courses (VIDEO)
  '/store/courses': {
    title: 'Course Marketplace',
    subtitle: 'Professional development courses and certifications.',
    videoSrc: VIDEO_HEROES.storeCourses,
    videoPoster: '/images/pages/training-classroom.webp',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Browse Courses', href: '#courses' },
  },

  // Store - Digital (VIDEO)
  '/store/digital': {
    title: 'Digital Products',
    subtitle: 'Workbooks, guides, and resources for career success.',
    videoSrc: VIDEO_HEROES.storeDigital,
    videoPoster: '/images/pages/business-sector.webp',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Browse Products', href: '#products' },
  },

  // LMS Courses (VIDEO)
  '/lms/courses': {
    title: 'My Courses',
    subtitle: 'Access your enrolled courses and track your progress.',
    videoSrc: VIDEO_HEROES.lmsCourses,
    videoPoster: '/images/pages/training-cohort.webp',
    variant: 'video',
    height: 'compact',
  },
};

// Helper to get hero config for a page
export function getHeroConfig(pathname: string): PageHeroConfig | null {
  return PAGE_HEROES[pathname] || null;
}

// Helper to get category image
export function getCategoryImage(category: keyof typeof HERO_IMAGES, subcategory: string): string {
  const categoryImages = HERO_IMAGES[category];
  if (categoryImages && subcategory in categoryImages) {
    return categoryImages[subcategory as keyof typeof categoryImages];
  }
  // Fallback to a default
  return HERO_IMAGES.marketing.programs;
}
