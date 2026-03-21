/**
 * heroBanners.ts — centralized content model for all hero video banners.
 *
 * Rules:
 * - No headline, subheadline, or CTA belongs on the video frame.
 * - belowHeroHeadline / belowHeroSubheadline render BELOW the video.
 * - transcript renders in an expandable section below the fold.
 * - microLabel is 2–4 words max, rendered discreetly on the video.
 * - All pages must reference this file — no page-level hero content duplication.
 */

export interface HeroBannerCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface HeroBannerConfig {
  pageKey: string;
  posterImage: string;
  videoSrcDesktop: string;
  videoSrcMobile?: string;
  voiceoverSrc?: string;
  microLabel?: string;
  belowHeroHeadline: string;
  belowHeroSubheadline: string;
  primaryCta: HeroBannerCta;
  secondaryCta?: HeroBannerCta;
  trustIndicators?: string[];
  transcript?: string;
  analyticsName: string;
}

const heroBanners: Record<string, HeroBannerConfig> = {
  home: {
    pageKey: 'home',
    posterImage: '/images/pages/home-hero-video.jpg',
    videoSrcDesktop: '/videos/homepage-hero-montage.mp4',
    voiceoverSrc: '/videos/homepage-hero-new.mp3',
    microLabel: 'Indianapolis, Indiana',
    belowHeroHeadline: 'Workforce training for real jobs.',
    belowHeroSubheadline:
      'Healthcare, skilled trades, CDL, technology, and more — with funding pathways for eligible Indiana residents.',
    primaryCta: { label: 'Start Here', href: '/start' },
    secondaryCta: { label: 'See All Programs', href: '/programs', variant: 'secondary' },
    trustIndicators: [
      'WIOA & state funding available',
      'DOL Registered Apprenticeship Sponsor',
      'ETPL approved',
      'Indianapolis, Indiana',
    ],
    transcript:
      'At Elevate for Humanity, career training is built for real life. Short-term programs. Industry credentials. Funding that can cover the cost. And a direct path to work.',
    analyticsName: 'home',
  },

  about: {
    pageKey: 'about',
    posterImage: '/images/pages/about-hero.jpg',
    videoSrcDesktop: '/videos/about-mission.mp4',
    voiceoverSrc: '/audio/heroes/about.mp3',
    microLabel: 'Our Mission',
    belowHeroHeadline: 'Built for workforce outcomes.',
    belowHeroSubheadline:
      'Training, credential preparation, support services, and employer connections.',
    primaryCta: { label: 'Our Story', href: '/about#who-we-are' },
    secondaryCta: { label: 'Meet the Team', href: '/about#team', variant: 'secondary' },
    trustIndicators: [
      'Founded 2019',
      'Indianapolis, Indiana',
      'DOL Registered Apprenticeship Sponsor',
    ],
    transcript:
      'Elevate was built to connect training, credentials, and employment in one coordinated system. Not just classes. A workforce pathway.',
    analyticsName: 'about',
  },

  platform: {
    pageKey: 'platform',
    posterImage: '/images/pages/platform-page-1.jpg',
    videoSrcDesktop: '/videos/elevate-overview-with-narration.mp4',
    voiceoverSrc: '/audio/heroes/programs.mp3',
    microLabel: 'Workforce Infrastructure',
    belowHeroHeadline: 'Workforce infrastructure, not just a website.',
    belowHeroSubheadline:
      'A coordinated hub for training delivery, credential pathways, and employer connection.',
    primaryCta: { label: 'Schedule a Demo', href: '/contact' },
    secondaryCta: { label: 'Licensing Options', href: '/store/licensing', variant: 'secondary' },
    trustIndicators: [
      'Multi-tenant architecture',
      'WIOA & DOL compliant',
      'Audit-ready reporting',
    ],
    transcript:
      'This platform connects providers, credential pathways, employers, and workforce agencies through one coordinated infrastructure. The goal is simple: verified training, cleaner operations, and better outcomes.',
    analyticsName: 'platform',
  },

  'funding-how-it-works': {
    pageKey: 'funding-how-it-works',
    posterImage: '/images/pages/funding-page-3.jpg',
    // orientation-full.mp4 used until a dedicated funding hero video is produced
    videoSrcDesktop: '/videos/orientation-full.mp4',
    voiceoverSrc: '/audio/heroes/funding.mp3',
    microLabel: 'Funded Training',
    belowHeroHeadline: 'How funded training works.',
    belowHeroSubheadline:
      'WIOA, apprenticeship pathways, state grants, and guided enrollment.',
    primaryCta: { label: 'Check Eligibility', href: '/start' },
    secondaryCta: { label: 'Contact an Advisor', href: '/contact', variant: 'secondary' },
    trustIndicators: [
      'WIOA Title I funding',
      'Next Level Jobs eligible',
      'DOL Registered Apprenticeship',
      'Job Ready Indy (JRI)',
    ],
    transcript:
      'Funding should not be confusing. We help eligible participants navigate workforce programs, complete the steps, and move into training without unnecessary friction.',
    analyticsName: 'funding-how-it-works',
  },

  healthcare: {
    pageKey: 'healthcare',
    posterImage: '/images/pages/comp-program-template.jpg',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    voiceoverSrc: '/audio/heroes/healthcare.mp3',
    microLabel: 'Healthcare Programs',
    belowHeroHeadline: 'Healthcare training that leads to certification.',
    belowHeroSubheadline:
      'CNA, Medical Assistant, Pharmacy Technician, Phlebotomy, CPR, and more.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=healthcare' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: [
      'Free with WIOA funding',
      'State-approved curricula',
      'Clinical rotations included',
      'Job placement assistance',
    ],
    transcript:
      'Healthcare training should feel professional from day one. Learn the skills, prepare for certification, and step into patient-facing work with confidence.',
    analyticsName: 'healthcare',
  },

  store: {
    pageKey: 'store',
    posterImage: '/images/pages/store-licensing-hero.jpg',
    videoSrcDesktop: '/videos/store-whitelabel-narrated.mp4',
    videoSrcMobile: '/videos/store-demo-narrated.mp4',
    voiceoverSrc: '/audio/heroes/store.mp3',
    microLabel: 'White-Label Platform',
    belowHeroHeadline: 'License the LMS that runs workforce programs end to end.',
    belowHeroSubheadline:
      'One platform handles enrollment, eligibility, attendance, credentials, employer matching, compliance reporting, and grant tracking — all automated. Your brand, your domain, your instance.',
    primaryCta: { label: 'Start 14-Day Free Trial', href: '/store/trial' },
    secondaryCta: { label: 'Try Full Demo — No Signup', href: '/demo/admin', variant: 'secondary' },
    trustIndicators: [
      'No credit card required',
      'WIOA & DOL compliant',
      'White-label branding included',
      'Launch in two weeks',
    ],
    transcript:
      `If your organization manages workforce training, you already know the problem. Enrollment is tracked in spreadsheets. Eligibility paperwork gets emailed back and forth. WIOA reports are assembled by hand every quarter. Credentials are issued late — if at all. Employers call asking for candidate lists you don't have ready.

The Elevate Workforce Operating System was built to replace all of that.

When a student applies, the platform checks eligibility automatically, collects documents, and routes the application through your approval workflow — no paper, no re-keying. When they enroll, attendance is tracked in real time. When they complete a program, their credential is issued automatically and posted to a public verification page employers can check with a single link.

Your WIOA compliance reports generate themselves from enrollment data. PIRL reporting, ITA tracking, quarterly performance metrics — all automated. Your workforce board gets the data they need without your staff spending a week assembling it.

The employer portal gives your hiring partners a live view of pre-screened candidates with verified credentials. They can track apprenticeship hours, manage OJT reimbursement requests, and sign MOUs electronically. WOTC documentation is generated automatically.

You get your own branded instance — your logo, your domain, your colors. Students and employers see your organization. The platform is invisible.

We handle the hosting, security, backups, and updates. Your staff focuses on people, not data entry.

Two licensing options: Managed Platform starting at fifteen hundred dollars per month, or Enterprise Source-Use for organizations that need to deploy on their own infrastructure.

Both start with a 14-day free trial. No credit card required. Full platform access from day one.

Try the live demo — no signup, no time limit. Every screen is clickable. Search students, run reports, review applications, browse candidates. See exactly what your staff and students will use every day.`,
    analyticsName: 'store',
  },

  programs: {
    pageKey: 'programs',
    posterImage: '/images/pages/programs-hero.jpg',
    videoSrcDesktop: '/videos/programs-overview-video-with-narration.mp4',
    videoSrcMobile: '/videos/program-hero.mp4',
    voiceoverSrc: '/audio/heroes/programs.mp3',
    microLabel: 'Career Training',
    belowHeroHeadline: 'Start a Career — Not Just a Class',
    belowHeroSubheadline:
      'Get trained, certified, and connected to real job opportunities in weeks — not years. Most programs are available at no cost to eligible Indiana residents through WIOA and state funding.',
    primaryCta: { label: 'Apply Now', href: '/apply/student' },
    secondaryCta: { label: 'Find My Program', href: '#programs', variant: 'secondary' },
    trustIndicators: [
      'WIOA & state funding available',
      'DOL Registered Apprenticeship Sponsor',
      'ETPL approved training provider',
      'Job placement assistance included',
    ],
    transcript:
      `At Elevate for Humanity, we train adults for real jobs — in weeks, not years.

Every program we offer ends with a nationally recognized credential and a direct introduction to hiring employers. Not a participation certificate. A credential that verifies your skills and opens doors.

Here is what we offer.

In healthcare, we train Certified Nursing Assistants, Medical Assistants, Pharmacy Technicians, and Phlebotomy Technicians. CNA training runs six weeks. Medical Assistant runs twelve. Every program includes hands-on clinical practice and a proctored certification exam on-site at Elevate.

In skilled trades, we offer HVAC Technician training leading to EPA Section 608 certification, CDL Class A training for commercial driving careers, Electrical Technician, Welding Technology, Plumbing, and Construction Trades. Most trades programs run eight to twelve weeks. Starting wages range from twenty to thirty-five dollars per hour.

In technology, we offer IT Help Desk Technician leading to CompTIA A Plus, Cybersecurity Analyst leading to CompTIA Security Plus, Network Support, Web Development, and Software Development. Tech programs run six to twelve weeks.

In business, we offer Bookkeeping and QuickBooks, Office Administration, Tax Preparation, and Entrepreneurship. These programs run five to eight weeks and are designed for people who want to work in professional environments or start their own business.

We also offer registered apprenticeships in barbering, cosmetology, nail technology, and culinary arts — earn-while-you-learn programs where you work in a licensed shop and get paid from day one.

Most programs are available at no cost to eligible Indiana residents. Funding comes through WIOA Title One, the Indiana Workforce Ready Grant, Job Ready Indy, and other state and federal workforce programs. If you qualify, tuition, books, tools, and your certification exam fee are all covered.

The process is straightforward. Register at Indiana Career Connect. Meet with a WorkOne case manager. They determine your funding eligibility — usually within a week. Once funding is confirmed, you join a scheduled cohort. We provide all tools, materials, and safety gear. You focus on training.

After you complete your program, our career services team builds your resume, preps you for interviews, and makes direct introductions to hiring employers. Many of our students have job offers before their last day of class.

Apply online in minutes. No cost to apply. No obligation. Just the first step toward a career that pays.`,
    analyticsName: 'programs',
  },

  'skilled-trades': {
    pageKey: 'skilled-trades',
    posterImage: '/images/pages/skilled-trades-sector.jpg',
    videoSrcDesktop: '/videos/electrician-trades.mp4',
    voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
    microLabel: 'Skilled Trades',
    belowHeroHeadline: 'Skilled trades training for high-demand work.',
    belowHeroSubheadline: 'HVAC, Electrical, Welding, Plumbing, CDL, and Diesel.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=skilled-trades' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: [
      'Free with WIOA funding',
      'OSHA certifications included',
      'Hands-on training',
      'Apprenticeship pathways available',
    ],
    transcript:
      'In the trades, confidence comes from repetition, safety, and real equipment. Elevate trains for the field — with hands-on practice, credentials, and a clear route to employment.',
    analyticsName: 'skilled-trades',
  },
};

export default heroBanners;

/** Typed lookup — throws at build time if pageKey is wrong */
export function getHeroBanner(pageKey: keyof typeof heroBanners): HeroBannerConfig {
  const config = heroBanners[pageKey];
  if (!config) throw new Error(`No hero banner config found for pageKey: "${pageKey}"`);
  return config;
}
