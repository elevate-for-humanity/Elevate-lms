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

// Video hero sources - used across the site
// Rules: No gradient overlays, text in solid container, calm motion only
export const VIDEO_HEROES = {
  // Main/Marketing
  homepage: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4',
  careerServices: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/career-services-hero.mp4',
  
  // Program Categories
  barber: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/barber-hero.mp4',
  barberApprenticeship: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/barber-hero.mp4',
  healthcare: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/healthcare-hero.mp4',
  skilledTrades: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hvac-hero-final.mp4',
  technology: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4',
  
  // Government/Enterprise
  government: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4',
  workforceBoard: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4',
  
  // Store
  storeCourses: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4',
  storeDigital: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4',
  
  // LMS
  lmsCourses: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4',
} as const;

// Category-based hero image assignments
// Same category = same visual family, different specific images
export const HERO_IMAGES = {
  // Healthcare family
  healthcare: {
    cna: '/images/pages/comp-highlights-success.jpg',
    medicalAssistant: '/images/pages/comp-highlights-success.jpg',
    phlebotomy: '/images/pages/comp-highlights-success.jpg',
    cprFirstAid: '/images/pages/comp-highlights-success.jpg',
    drugCollector: '/images/pages/comp-highlights-success.jpg',
    dsp: '/images/pages/comp-highlights-success.jpg',
  },
  
  // Trades family
  trades: {
    hvac: '/images/pages/comp-highlights-success.jpg',
    cdl: '/images/pages/comp-highlights-success.jpg',
    welding: '/images/pages/comp-highlights-success.jpg',
    electrical: '/images/pages/comp-highlights-success.jpg',
    plumbing: '/images/pages/comp-highlights-success.jpg',
    diesel: '/images/pages/comp-highlights-success.jpg',
  },
  
  // Beauty/Apprenticeship family
  apprenticeship: {
    barber: '/images/pages/comp-highlights-success.jpg',
    cosmetology: '/images/pages/comp-highlights-success.jpg',
    esthetician: '/images/pages/comp-highlights-success.jpg',
    nailTech: '/images/pages/comp-highlights-success.jpg',
  },
  
  // Technology family
  technology: {
    itSupport: '/images/pages/comp-highlights-success.jpg',
    cybersecurity: '/images/pages/comp-highlights-success.jpg',
    webDev: '/images/pages/comp-highlights-success.jpg',
  },
  
  // Business family
  business: {
    taxPrep: '/images/pages/comp-highlights-success.jpg',
    entrepreneurship: '/images/pages/comp-highlights-success.jpg',
    businessAdmin: '/images/pages/comp-highlights-success.jpg',
  },
  
  // Enterprise/Licensing family
  enterprise: {
    licensing: '/images/pages/comp-highlights-success.jpg',
    whiteLabel: '/images/pages/comp-highlights-success.jpg',
    partners: '/images/pages/comp-highlights-success.jpg',
    government: '/images/pages/comp-highlights-success.jpg',
  },
  
  // Marketing/General
  marketing: {
    homepage: '/images/pages/comp-highlights-success.jpg',
    programs: '/images/pages/comp-highlights-success.jpg',
    about: '/images/pages/comp-highlights-success.jpg',
    careers: '/images/pages/comp-highlights-success.jpg',
    contact: '/images/pages/comp-highlights-success.jpg',
  },
  
  // LMS/Portal (use screenshots/UI imagery)
  lms: {
    studentPortal: '/images/pages/comp-highlights-success.jpg',
    dashboard: '/images/pages/comp-highlights-success.jpg',
    courses: '/images/pages/comp-highlights-success.jpg',
  },
  
  // Governance/Policy (use illustrations/diagrams)
  governance: {
    privacy: '/images/pages/comp-highlights-success.jpg',
    terms: '/images/pages/comp-highlights-success.jpg',
    ferpa: '/images/pages/comp-highlights-success.jpg',
    accessibility: '/images/pages/comp-highlights-success.jpg',
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
    subtitle: 'WIOA-funded workforce programs in healthcare, skilled trades, and technology. No cost if you qualify.',
    videoSrc: VIDEO_HEROES.homepage,
    videoPoster: '/images/pages/comp-highlights-success.jpg',
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
    subtitle: 'Industry-recognized certifications in high-demand fields. Free for eligible participants.',
    image: '/images/pages/comp-highlights-success.jpg',
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
    subtitle: 'Become a licensed barber through our USDOL-registered apprenticeship. Earn while you learn.',
    videoSrc: VIDEO_HEROES.barberApprenticeship,
    videoPoster: '/images/pages/comp-highlights-success.jpg',
    variant: 'video',
    height: 'medium',
    badge: 'USDOL Registered',
    metadata: [
      { label: 'Duration', value: '1,500 hours' },
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
    image: '/images/pages/comp-highlights-success.jpg',
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
    image: '/images/pages/comp-highlights-success.jpg',
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
  '/programs/cdl': {
    title: 'CDL Training Program',
    subtitle: 'Get your Commercial Driver\'s License and start a career in transportation.',
    image: '/images/pages/comp-highlights-success.jpg',
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
    image: '/images/pages/comp-highlights-success.jpg',
    variant: 'split',
    height: 'medium',
    badge: 'Certiport Authorized',
    metadata: [
      { label: 'Duration', value: '8-12 weeks' },
      { label: 'Format', value: 'Hybrid' },
      { label: 'Certification', value: 'Certiport IT Specialist' },
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=it-support' },
    ctaSecondary: { label: 'Check Eligibility', href: '/wioa-eligibility' },
  },
  
  // ============================================
  // PRIORITY 8: Apply/Enrollment
  // ============================================
  '/apply': {
    title: 'Start Your Application',
    subtitle: 'Take the first step toward a new career. Our team will guide you through the process.',
    image: '/images/pages/comp-highlights-success.jpg',
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
    subtitle: 'Deploy the Elevate LMS platform for your organization. Managed infrastructure, your brand.',
    image: '/images/pages/comp-highlights-success.jpg',
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
    image: '/images/pages/comp-highlights-success.jpg',
    variant: 'split',
    height: 'compact',
  },
  
  // ============================================
  // ADDITIONAL KEY PAGES
  // ============================================
  
  // About
  '/about': {
    title: 'About Elevate for Humanity',
    subtitle: 'Breaking the cycle of poverty through free workforce training since 2020.',
    image: '/images/pages/comp-highlights-success.jpg',
    variant: 'split',
    height: 'medium',
    ctaPrimary: { label: 'Our Mission', href: '/about/mission' },
    ctaSecondary: { label: 'Meet the Team', href: '/about/team' },
  },
  
  // Contact
  '/contact': {
    title: 'Contact Us',
    subtitle: 'Questions about programs, enrollment, or partnerships? We\'re here to help.',
    image: '/images/pages/comp-highlights-success.jpg',
    variant: 'split',
    height: 'medium',
    ctaPrimary: { label: 'Call Now', href: 'tel:3173143757' },
  },
  
  // Testimonials
  '/testimonials': {
    title: 'Success Stories',
    subtitle: 'Real graduates. Real careers. Real impact.',
    image: '/images/pages/comp-highlights-success.jpg',
    variant: 'split',
    height: 'medium',
    ctaPrimary: { label: 'Start Your Journey', href: '/apply' },
  },
  
  // FERPA (Governance)
  '/policies/ferpa': {
    title: 'FERPA Privacy Policy',
    subtitle: 'How we protect student education records under federal law.',
    image: '/images/pages/comp-highlights-success.jpg',
    variant: 'illustration',
    height: 'compact',
  },
  
  // Privacy Policy (Governance)
  '/privacy': {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your information.',
    image: '/images/pages/comp-highlights-success.jpg',
    variant: 'illustration',
    height: 'compact',
  },
  
  // ============================================
  // VIDEO HERO PAGES (Category Landings)
  // ============================================
  
  // Barber Category (VIDEO)
  '/programs/barber': {
    title: 'Barber Training Programs',
    subtitle: 'Start your career in barbering with hands-on training and apprenticeship opportunities.',
    videoSrc: VIDEO_HEROES.barber,
    videoPoster: '/images/pages/comp-highlights-success.jpg',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=barber' },
    ctaSecondary: { label: 'View Programs', href: '#programs' },
  },
  
  // Healthcare Category (VIDEO)
  '/programs/healthcare': {
    title: 'Healthcare Training Programs',
    subtitle: 'Launch your healthcare career with CNA, Medical Assistant, and Phlebotomy training.',
    videoSrc: VIDEO_HEROES.healthcare,
    videoPoster: '/images/pages/comp-highlights-success.jpg',
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
    videoPoster: '/images/pages/comp-highlights-success.jpg',
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
    videoPoster: '/images/pages/comp-highlights-success.jpg',
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
    videoPoster: '/images/pages/comp-highlights-success.jpg',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Get Started', href: '/career-services/contact' },
  },
  
  // Government (VIDEO)
  '/government': {
    title: 'Government Partners',
    subtitle: 'Workforce development solutions for state and local agencies.',
    videoSrc: VIDEO_HEROES.government,
    videoPoster: '/images/pages/comp-highlights-success.jpg',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Partner With Us', href: '/contact' },
  },
  
  // Workforce Board (VIDEO)
  '/workforce-board': {
    title: 'Workforce Board Portal',
    subtitle: 'Manage participants, track outcomes, and generate compliance reports.',
    videoSrc: VIDEO_HEROES.workforceBoard,
    videoPoster: '/images/pages/comp-highlights-success.jpg',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Access Portal', href: '/workforce-board/dashboard' },
  },
  
  // Store - Courses (VIDEO)
  '/store/courses': {
    title: 'Course Marketplace',
    subtitle: 'Professional development courses and certifications.',
    videoSrc: VIDEO_HEROES.storeCourses,
    videoPoster: '/images/pages/comp-highlights-success.jpg',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Browse Courses', href: '#courses' },
  },
  
  // Store - Digital (VIDEO)
  '/store/digital': {
    title: 'Digital Products',
    subtitle: 'Workbooks, guides, and resources for career success.',
    videoSrc: VIDEO_HEROES.storeDigital,
    videoPoster: '/images/pages/comp-highlights-success.jpg',
    variant: 'video',
    height: 'medium',
    ctaPrimary: { label: 'Browse Products', href: '#products' },
  },
  
  // LMS Courses (VIDEO)
  '/lms/courses': {
    title: 'My Courses',
    subtitle: 'Access your enrolled courses and track your progress.',
    videoSrc: VIDEO_HEROES.lmsCourses,
    videoPoster: '/images/pages/comp-highlights-success.jpg',
    variant: 'video',
    height: 'compact',
  },
};

// Helper to get hero config for a page
export function getHeroConfig(pathname: string): PageHeroConfig | null {
  return PAGE_HEROES[pathname] || null;
}

// Helper to get category image
export function getCategoryImage(
  category: keyof typeof HERO_IMAGES,
  subcategory: string
): string {
  const categoryImages = HERO_IMAGES[category];
  if (categoryImages && subcategory in categoryImages) {
    return categoryImages[subcategory as keyof typeof categoryImages];
  }
  // Fallback to a default
  return HERO_IMAGES.marketing.programs;
}
