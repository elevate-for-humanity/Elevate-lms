/**
 * heroBanners.ts — centralized content model for all hero video banners.
 *
 * Rules:
 * - No headline, subheadline, or CTA belongs on the video frame.
 * - belowHeroHeadline / belowHeroSubheadline render BELOW the video.
 * - transcript renders in an expandable section below the fold.
 * - microLabel is 2–4 words max, rendered discreetly on the video.
 * - All pages must reference this file — no page-level hero content duplication.
 *
 * Internal program banners use programBanner() which enforces:
 * - credentialLabel, durationLabel, salaryRangeLabel as first-class fields
 * - transcript must include all three exact values
 * - transcript length 180–360 characters
 * - trustIndicators 4–6 unique items
 * - microLabel 4 words or fewer
 * - no banned marketing phrases
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
  // Structured fields — required on internal program banners
  credentialLabel?: string;
  durationLabel?: string;
  salaryRangeLabel?: string;
}

// ── Validator infrastructure ──────────────────────────────────────────────

const BANNED_PHRASES = [
  'rewarding career',
  'exciting future',
  'in-demand',
  'career-ready',
  'next step',
  'start your journey',
  'launch your career',
  'transform your life',
  'take the next step',
];

function fail(key: string, message: string): never {
  throw new Error(`[heroBanners] ${key}: ${message}`);
}

export function programBanner(key: string, config: HeroBannerConfig): HeroBannerConfig {
  const { microLabel, credentialLabel, durationLabel, salaryRangeLabel, trustIndicators, transcript } = config;

  if (!credentialLabel?.trim()) fail(key, 'credentialLabel is required');
  if (!durationLabel?.trim()) fail(key, 'durationLabel is required');
  if (!salaryRangeLabel?.trim()) fail(key, 'salaryRangeLabel is required');
  if (!microLabel?.trim()) fail(key, 'microLabel is required');
  if (!transcript?.trim()) fail(key, 'transcript is required');

  const microWords = microLabel!.trim().split(/\s+/);
  if (microWords.length > 4) fail(key, 'microLabel must be 4 words or fewer');

  if (!Array.isArray(trustIndicators)) fail(key, 'trustIndicators must be an array');
  if (trustIndicators!.length < 4 || trustIndicators!.length > 6) fail(key, 'trustIndicators must contain 4 to 6 items');

  const deduped = new Set(trustIndicators!.map((x) => x.trim().toLowerCase()));
  if (deduped.size !== trustIndicators!.length) fail(key, 'trustIndicators must not contain duplicates');

  if (transcript!.length < 180 || transcript!.length > 360) {
    fail(key, `transcript must be 180–360 characters (got ${transcript!.length})`);
  }

  if (!transcript!.includes(credentialLabel!)) fail(key, `transcript must include exact credentialLabel: "${credentialLabel}"`);
  if (!transcript!.includes(durationLabel!)) fail(key, `transcript must include exact durationLabel: "${durationLabel}"`);
  if (!transcript!.includes(salaryRangeLabel!)) fail(key, `transcript must include exact salaryRangeLabel: "${salaryRangeLabel}"`);

  const bannedHit = BANNED_PHRASES.find((p) => transcript!.toLowerCase().includes(p));
  if (bannedHit) fail(key, `transcript contains banned phrase: "${bannedHit}"`);

  if (!/\b(prepare|train|build|develop|learn|complete|earn)\b/i.test(transcript!)) {
    fail(key, 'transcript must use concrete action language');
  }

  if (!/[.?!]$/.test(transcript!.trim())) fail(key, 'transcript must end with sentence punctuation');

  // HSI partner enforcement — CPR/first-aid must name the certifying body
  const HSI_SLUGS = ['cpr-first-aid', 'emergency-health-safety', 'sanitation-infection-control'];
  if (HSI_SLUGS.includes(config.pageKey)) {
    if (!/\bHSI\b/i.test(transcript!)) {
      fail(key, 'HSI-partner program transcript must reference "HSI" as the certifying body');
    }
  }

  // Non-salary programs must signal certification value or compliance requirement
  const EMPTY_SALARY = ['', 'n/a', 'varies'];
  if (EMPTY_SALARY.includes(salaryRangeLabel!.toLowerCase())) {
    if (!/\b(certif|compliance|required|license|credential)\b/i.test(transcript!)) {
      fail(key, 'non-salary program transcript must include certification, compliance, or licensing language');
    }
  }

  // Video/poster pairing — if video is set, poster must be set (no blank frames)
  if (config.videoSrcDesktop && !config.posterImage) {
    fail(key, 'videoSrcDesktop requires posterImage to prevent blank frames on load');
  }

  return config;
}

export function buildTranscript({
  credentialLabel,
  durationLabel,
  salaryRangeLabel,
  skills,
}: {
  credentialLabel: string;
  durationLabel: string;
  salaryRangeLabel: string;
  skills: [string, string, string?];
}): string {
  const skillText = [skills[0], skills[1], skills[2]].filter(Boolean).join(', ');
  return `Train for ${credentialLabel} in ${durationLabel}, building practical skills in ${skillText}. Related entry-level opportunities commonly fall in the ${salaryRangeLabel} range depending on employer, experience, and local market.`;
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
    microLabel: 'Multi-Tenant Hub',
    belowHeroHeadline: 'Workforce infrastructure for providers, agencies, and employers.',
    belowHeroSubheadline:
      'One coordinated system for training delivery, credential pathways, compliance reporting, and employer placement.',
    primaryCta: { label: 'Schedule a Demo', href: '/contact' },
    secondaryCta: { label: 'Licensing Options', href: '/store/licensing', variant: 'secondary' },
    trustIndicators: [
      'Multi-tenant architecture',
      'WIOA & DOL compliant',
      'Audit-ready reporting',
      'Role-based data isolation',
    ],
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
    analyticsName: 'skilled-trades',
  },

  // ── Individual program pages — validated via programBanner() ─────────────

  'hvac-technician': programBanner('hvac-technician', {
    pageKey: 'hvac-technician',
    posterImage: '/images/pages/hvac-unit.jpg',
    videoSrcDesktop: '/videos/hvac-hero-final.mp4',
    voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
    microLabel: 'HVAC Training',
    belowHeroHeadline: 'Become an HVAC Technician in 20 weeks.',
    belowHeroSubheadline: 'Earn EPA 608 Universal, OSHA 30, and four additional credentials. Most students pay nothing through the Workforce Ready Grant.',
    primaryCta: { label: 'Apply Now', href: '/programs/hvac-technician/apply' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['EPA 608 Proctor Site', 'Workforce Ready Grant eligible', 'OSHA 30 included', 'Job placement assistance'],
    credentialLabel: 'EPA 608 Universal',
    durationLabel: '20 weeks',
    salaryRangeLabel: '$20 to $35 per hour',
    transcript: 'Train for EPA 608 Universal in 20 weeks, building practical skills in refrigerant handling, system diagnostics, and residential installation. Related entry-level opportunities commonly fall in the $20 to $35 per hour range depending on employer, experience, and local market.',
    analyticsName: 'hvac-technician',
  }),

  'cdl-training': programBanner('cdl-training', {
    pageKey: 'cdl-training',
    posterImage: '/images/pages/cdl-truck-highway.jpg',
    videoSrcDesktop: '/videos/cdl-hero.mp4',
    voiceoverSrc: '/audio/heroes/cdl.mp3',
    microLabel: 'CDL Class A',
    belowHeroHeadline: 'Get your CDL Class A in 3–6 weeks.',
    belowHeroSubheadline: 'Behind-the-wheel training, pre-trip inspection, and job placement with trucking companies. WIOA funding covers tuition for eligible participants.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=cdl-training' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'Starting pay $22–$35/hr', 'Job placement included', 'DOT physical covered'],
    credentialLabel: 'CDL Class A',
    durationLabel: '3 to 6 weeks',
    salaryRangeLabel: '$22 to $35 per hour',
    transcript:
      'Train for CDL Class A in 3 to 6 weeks, building practical skills in pre-trip inspection, backing maneuvers, and DOT compliance. Related entry-level opportunities commonly fall in the $22 to $35 per hour range depending on employer, experience, and local market.',
    analyticsName: 'cdl-training',
  }),

  'electrical': programBanner('electrical', {
    pageKey: 'electrical',
    posterImage: '/images/pages/electrical-wiring.jpg',
    videoSrcDesktop: '/videos/electrician-trades.mp4',
    voiceoverSrc: '/audio/heroes/electrical.mp3',
    microLabel: 'Electrical Trades',
    belowHeroHeadline: 'Electrical Technician training in 12 weeks.',
    belowHeroSubheadline: 'Residential and commercial wiring, NEC code, and safety. Graduate with OSHA 30 and NCCER credentials. WIOA funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=electrical' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'OSHA 30 included', 'NCCER credential', '3-Star Indiana Top Job'],
    credentialLabel: 'NCCER Electrical Technician',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$20 to $32 per hour',
    transcript:
      'Train for NCCER Electrical Technician in 12 weeks, building practical skills in residential wiring, NEC code, and commercial circuits. Related entry-level opportunities commonly fall in the $20 to $32 per hour range depending on employer, experience, and local market.',
    analyticsName: 'electrical',
  }),

  'welding': programBanner('welding', {
    pageKey: 'welding',
    posterImage: '/images/pages/welding-sparks.jpg',
    videoSrcDesktop: '/videos/welding-trades.mp4',
    voiceoverSrc: '/audio/heroes/welding.mp3',
    microLabel: 'Welding Technology',
    belowHeroHeadline: 'Welding Technology — 10 weeks to AWS certification.',
    belowHeroSubheadline: 'Learn MIG, TIG, and stick welding from industry professionals. Graduate with AWS certifications and OSHA 30. WIOA funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=welding' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'AWS certifications', 'OSHA 30 included', 'Starting pay $54K avg'],
    credentialLabel: 'AWS Welding Certification',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$18 to $30 per hour',
    transcript:
      'Train for AWS Welding Certification in 10 weeks, building practical skills in MIG welding, TIG welding, and blueprint reading. Related entry-level opportunities commonly fall in the $18 to $30 per hour range depending on employer, experience, and local market.',
    analyticsName: 'welding',
  }),

  'plumbing': programBanner('plumbing', {
    pageKey: 'plumbing',
    posterImage: '/images/pages/plumbing-pipes.jpg',
    videoSrcDesktop: '/videos/welding-trades.mp4',
    voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
    microLabel: 'Plumbing Trades',
    belowHeroHeadline: 'Plumbing Technician training in 10 weeks.',
    belowHeroSubheadline: 'Install and repair residential and commercial plumbing systems. Earn OSHA 10 and NCCER credentials. WIOA funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=plumbing' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'OSHA 10 included', 'NCCER credential', 'Hands-on training'],
    credentialLabel: 'NCCER Plumbing Technician',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$18 to $28 per hour',
    transcript:
      'Train for NCCER Plumbing Technician in 10 weeks, building practical skills in pipe fitting, residential systems, and code compliance. Related entry-level opportunities commonly fall in the $18 to $28 per hour range depending on employer, experience, and local market.',
    analyticsName: 'plumbing',
  }),

  'diesel-mechanic': programBanner('diesel-mechanic', {
    pageKey: 'diesel-mechanic',
    posterImage: '/images/pages/diesel-mechanic.jpg',
    videoSrcDesktop: '/videos/welding-trades.mp4',
    voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
    microLabel: 'Diesel Mechanic',
    belowHeroHeadline: 'Diesel Mechanic training in 12 weeks.',
    belowHeroSubheadline: 'Diagnose and repair diesel engines, transmissions, and hydraulic systems. OSHA 10 and ASE prep included. WIOA funding available.',
    primaryCta: { label: 'Express Interest', href: '/apply?program=diesel-mechanic' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'OSHA 10 included', 'ASE exam prep', 'High-demand career'],
    credentialLabel: 'ASE Diesel Technician',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$20 to $32 per hour',
    transcript:
      'Train for ASE Diesel Technician in 12 weeks, building practical skills in engine diagnostics, transmission repair, and hydraulic systems. Related entry-level opportunities commonly fall in the $20 to $32 per hour range depending on employer, experience, and local market.',
    analyticsName: 'diesel-mechanic',
  }),

  'construction-trades-certification': programBanner('construction-trades-certification', {
    pageKey: 'construction-trades-certification',
    posterImage: '/images/pages/construction-trades.jpg',
    videoSrcDesktop: '/videos/electrician-trades.mp4',
    voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
    microLabel: 'Construction Trades',
    belowHeroHeadline: 'Construction Trades Certification in 8 weeks.',
    belowHeroSubheadline: 'Earn OSHA 30, EPA 608, and forklift certifications. Multi-trade foundation for construction careers. WIOA funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=construction-trades-certification' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'OSHA 30 included', 'EPA 608 included', 'Forklift cert included'],
    credentialLabel: 'NCCER Core Curriculum',
    durationLabel: '8 weeks',
    salaryRangeLabel: '$17 to $28 per hour',
    transcript:
      'Train for NCCER Core Curriculum in 8 weeks, building practical skills in hand tools, construction math, and site safety. Related entry-level opportunities commonly fall in the $17 to $28 per hour range depending on employer, experience, and local market.',
    analyticsName: 'construction-trades-certification',
  }),

  'forklift': programBanner('forklift', {
    pageKey: 'forklift',
    posterImage: '/images/pages/forklift.jpg',
    videoSrcDesktop: '/videos/electrician-trades.mp4',
    voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
    microLabel: 'Forklift Certification',
    belowHeroHeadline: 'Forklift Operator Certification in 1 week.',
    belowHeroSubheadline: 'OSHA-compliant training on sit-down, stand-up, and reach truck forklifts. Get certified and job-ready for warehouse and logistics roles.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=forklift' },
    secondaryCta: { label: 'View Schedule', href: '/contact?program=forklift', variant: 'secondary' },
    trustIndicators: ['OSHA-compliant cert', 'Hands-on equipment', 'WIOA funding available', 'Starting pay $15–$20/hr'],
    credentialLabel: 'OSHA Forklift Operator',
    durationLabel: '1 week',
    salaryRangeLabel: '$16 to $22 per hour',
    transcript:
      'Train for OSHA Forklift Operator in 1 week, building practical skills in load handling, pre-operation inspection, and warehouse safety. Related entry-level opportunities commonly fall in the $16 to $22 per hour range depending on employer, experience, and local market.',
    analyticsName: 'forklift',
  }),

  'cna': programBanner('cna', {
    pageKey: 'cna',
    posterImage: '/images/pages/cna-patient-care.jpg',
    videoSrcDesktop: '/videos/cna-hero.mp4',
    voiceoverSrc: '/audio/heroes/cna.mp3',
    microLabel: 'CNA Program',
    belowHeroHeadline: 'Become a Certified Nursing Assistant.',
    belowHeroSubheadline: 'State certification exam included. Start a career in hospitals, nursing facilities, and clinics. Join the waiting list for upcoming cohorts.',
    primaryCta: { label: 'Join Waiting List', href: '/programs/cna#waitlist' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['State certification included', 'WIOA funding available', 'Clinical rotations', 'Job placement assistance'],
    credentialLabel: 'Indiana CNA Certification',
    durationLabel: '6 weeks',
    salaryRangeLabel: '$15 to $22 per hour',
    transcript:
      'Train for Indiana CNA Certification in 6 weeks, building practical skills in patient care, vital signs, and infection control. Related entry-level opportunities commonly fall in the $15 to $22 per hour range depending on employer, experience, and local market.',
    analyticsName: 'cna',
  }),

  'medical-assistant': programBanner('medical-assistant', {
    pageKey: 'medical-assistant',
    posterImage: '/images/pages/medical-assistant-lab.jpg',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    voiceoverSrc: '/audio/heroes/medical-assistant.mp3',
    microLabel: 'Medical Assistant',
    belowHeroHeadline: 'Medical Assistant — CCMA certification in 12 weeks.',
    belowHeroSubheadline: 'Clinical and administrative medical assisting skills. One of the fastest-growing healthcare roles. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=medical-assistant' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'CCMA exam prep', '14% job growth', 'Clinical rotations included'],
    credentialLabel: 'Certified Medical Assistant',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$16 to $24 per hour',
    transcript:
      'Train for Certified Medical Assistant in 12 weeks, building practical skills in clinical procedures, EHR documentation, and patient intake. Related entry-level opportunities commonly fall in the $16 to $24 per hour range depending on employer, experience, and local market.',
    analyticsName: 'medical-assistant',
  }),

  'pharmacy-technician': programBanner('pharmacy-technician', {
    pageKey: 'pharmacy-technician',
    posterImage: '/images/pages/pharmacy-tech.jpg',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    voiceoverSrc: '/audio/heroes/healthcare.mp3',
    microLabel: 'Pharmacy Technician',
    belowHeroHeadline: 'Pharmacy Technician — CPhT certification in 10 weeks.',
    belowHeroSubheadline: 'Medication dispensing, pharmacy law, sterile compounding, and inventory management. Prepare for the PTCB exam. Free with WIOA funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=pharmacy-technician' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'PTCB exam prep', 'Next Level Jobs accepted', 'Payment plans available'],
    credentialLabel: 'PTCB Pharmacy Technician',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$15 to $22 per hour',
    transcript:
      'Train for PTCB Pharmacy Technician in 10 weeks, building practical skills in medication dispensing, inventory management, and pharmacy law. Related entry-level opportunities commonly fall in the $15 to $22 per hour range depending on employer, experience, and local market.',
    analyticsName: 'pharmacy-technician',
  }),

  'phlebotomy': programBanner('phlebotomy', {
    pageKey: 'phlebotomy',
    posterImage: '/images/pages/phlebotomy.jpg',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    voiceoverSrc: '/audio/heroes/healthcare.mp3',
    microLabel: 'Phlebotomy',
    belowHeroHeadline: 'Phlebotomy Technician — CPT certification in 4 weeks.',
    belowHeroSubheadline: '120 hours of classroom and clinical training. Prepare for the NHA Certified Phlebotomy Technician exam. Start working in clinics and labs within a month.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=phlebotomy' },
    secondaryCta: { label: 'Payment Plans', href: '/contact?program=phlebotomy', variant: 'secondary' },
    trustIndicators: ['NHA CPT exam prep', 'Clinical training included', 'Flexible payment plans', 'Starting pay $16–$22/hr'],
    credentialLabel: 'NPA Phlebotomy Technician',
    durationLabel: '6 weeks',
    salaryRangeLabel: '$15 to $20 per hour',
    transcript:
      'Train for NPA Phlebotomy Technician in 6 weeks, building practical skills in venipuncture, specimen handling, and patient communication. Related entry-level opportunities commonly fall in the $15 to $20 per hour range depending on employer, experience, and local market.',
    analyticsName: 'phlebotomy',
  }),

  'home-health-aide': programBanner('home-health-aide', {
    pageKey: 'home-health-aide',
    posterImage: '/images/pages/healthcare-classroom.jpg',
    videoSrcDesktop: '/videos/cna-hero.mp4',
    voiceoverSrc: '/audio/heroes/healthcare.mp3',
    microLabel: 'Home Health Aide',
    belowHeroHeadline: 'Home Health Aide Certification in 4 weeks.',
    belowHeroSubheadline: 'Earn CCHW and HHA certifications for in-home care careers. Free with WIOA or Workforce Ready Grant.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=home-health-aide' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'CCHW & HHA certifications', 'ETPL approved', 'Job placement assistance'],
    credentialLabel: 'Indiana HHA Certification',
    durationLabel: '4 weeks',
    salaryRangeLabel: '$14 to $19 per hour',
    transcript:
      'Train for Indiana HHA Certification in 4 weeks, building practical skills in personal care, mobility assistance, and home safety. Related entry-level opportunities commonly fall in the $14 to $19 per hour range depending on employer, experience, and local market.',
    analyticsName: 'home-health-aide',
  }),

  'emergency-health-safety': programBanner('emergency-health-safety', {
    pageKey: 'emergency-health-safety',
    posterImage: '/images/pages/cpr-aed.jpg',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    voiceoverSrc: '/audio/heroes/healthcare.mp3',
    microLabel: 'Emergency Health & Safety',
    belowHeroHeadline: 'Emergency Health & Safety Technician in 4 weeks.',
    belowHeroSubheadline: 'Earn EMR, CPR/AED, First Aid, and OSHA 10 certifications for healthcare and public safety careers. Free with WIOA or Workforce Ready Grant.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=emergency-health-safety' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['HSI certified', 'OSHA 10 included', 'WIOA eligible', 'ETPL approved'],
    credentialLabel: 'Emergency Health Safety Certificate',
    durationLabel: '2 weeks',
    salaryRangeLabel: '$15 to $22 per hour',
    transcript:
      'Train for Emergency Health Safety Certificate in 2 weeks through HSI-certified instruction, building practical skills in first aid response, AED operation, and emergency protocols. Related entry-level opportunities commonly fall in the $15 to $22 per hour range depending on employer, experience, and local market.',
    analyticsName: 'emergency-health-safety',
  }),

  'cpr-first-aid': programBanner('cpr-first-aid', {
    pageKey: 'cpr-first-aid',
    posterImage: '/images/pages/cpr-mannequin.jpg',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    voiceoverSrc: '/audio/heroes/cpr.mp3',
    microLabel: 'CPR & First Aid',
    belowHeroHeadline: 'CPR & First Aid Certification — train from home.',
    belowHeroSubheadline: 'Live instructor. Mannequin shipped to your door. HSI-certified training for healthcare, education, and licensed professions. $130.',
    primaryCta: { label: 'Enroll Now', href: '/apply?program=cpr-first-aid' },
    secondaryCta: { label: 'Learn More', href: '/contact?program=cpr-first-aid', variant: 'secondary' },
    trustIndicators: ['HSI certified', 'Mannequin included', 'Live instructor', 'Included free with Elevate programs'],
    credentialLabel: 'CPR/AED Certification',
    durationLabel: '1 day',
    salaryRangeLabel: '$15 to $22 per hour',
    transcript:
      'Earn CPR/AED Certification in 1 day through HSI-certified instruction, building practical skills in chest compressions, rescue breathing, and AED operation. Required for healthcare, education, and many licensed professions. Related entry-level opportunities commonly fall in the $15 to $22 per hour range depending on employer, experience, and local market.',
    analyticsName: 'cpr-first-aid',
  }),

  'sanitation-infection-control': programBanner('sanitation-infection-control', {
    pageKey: 'sanitation-infection-control',
    posterImage: '/images/pages/sanitation.jpg',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    voiceoverSrc: '/audio/heroes/healthcare.mp3',
    microLabel: 'Sanitation & Safety',
    belowHeroHeadline: 'Sanitation & Infection Control Certification in 2 weeks.',
    belowHeroSubheadline: 'ServSafe and infection control certifications for healthcare, food service, and personal services. Included free with Elevate training programs.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=sanitation-infection-control' },
    secondaryCta: { label: 'Learn More', href: '/contact?program=sanitation-infection-control', variant: 'secondary' },
    trustIndicators: ['HSI certified', 'ServSafe included', 'Required for healthcare', 'Included with programs'],
    credentialLabel: 'Infection Control Certificate',
    durationLabel: '2 weeks',
    salaryRangeLabel: '$15 to $22 per hour',
    transcript:
      'Earn Infection Control Certificate in 2 weeks through HSI-certified instruction, building practical skills in PPE protocols, surface disinfection, and outbreak prevention. Required for healthcare, food service, and personal services compliance. Related entry-level opportunities commonly fall in the $15 to $22 per hour range depending on employer, experience, and local market.',
    analyticsName: 'sanitation-infection-control',
  }),

  'barber-apprenticeship': programBanner('barber-apprenticeship', {
    pageKey: 'barber-apprenticeship',
    posterImage: '/images/pages/barber-hero-main.jpg',
    videoSrcDesktop: '/videos/barber-hero-final.mp4',
    voiceoverSrc: '/audio/heroes/barber.mp3',
    microLabel: 'Barber Apprenticeship',
    belowHeroHeadline: 'Earn your Indiana Barber License while getting paid.',
    belowHeroSubheadline: 'DOL Registered Apprenticeship. 2,000 hours of training in a licensed barbershop under a master barber. Earn wages from day one.',
    primaryCta: { label: 'Apply Now', href: '/programs/barber-apprenticeship/apply' },
    secondaryCta: { label: 'Find a Host Shop', href: '/programs/barber-apprenticeship/host-shops', variant: 'secondary' },
    trustIndicators: ['DOL Registered Apprenticeship', 'Earn while you train', 'Indiana Barber License', 'Rise Up certification'],
    credentialLabel: 'Indiana Barber License',
    durationLabel: '2 years',
    salaryRangeLabel: '$18 to $40 per hour',
    transcript:
      'Earn Indiana Barber License in 2 years through a registered apprenticeship, building practical skills in cutting, shaving, and salon operations. Related entry-level opportunities commonly fall in the $18 to $40 per hour range depending on employer, experience, and local market.',
    analyticsName: 'barber-apprenticeship',
  }),

  'cosmetology-apprenticeship': programBanner('cosmetology-apprenticeship', {
    pageKey: 'cosmetology-apprenticeship',
    posterImage: '/images/pages/cosmetology.jpg',
    videoSrcDesktop: '/videos/beauty-cosmetology.mp4',
    voiceoverSrc: '/audio/heroes/cosmetology.mp3',
    microLabel: 'Cosmetology Apprenticeship',
    belowHeroHeadline: 'Earn your Indiana Cosmetology License while getting paid.',
    belowHeroSubheadline: 'DOL Registered Apprenticeship. 2,000 hours of supervised training in a licensed salon. Earn wages from day one.',
    primaryCta: { label: 'Apply Now', href: '/programs/cosmetology-apprenticeship/apply' },
    secondaryCta: { label: 'Learn More', href: '/contact?program=cosmetology-apprenticeship', variant: 'secondary' },
    trustIndicators: ['DOL Registered Apprenticeship', 'Earn while you train', 'Indiana Cosmetology License', 'Salon-based training'],
    credentialLabel: 'Indiana Cosmetology License',
    durationLabel: '2 years',
    salaryRangeLabel: '$16 to $38 per hour',
    transcript:
      'Earn Indiana Cosmetology License in 2 years through a registered apprenticeship, building practical skills in hair color, chemical services, and client consultation. Related entry-level opportunities commonly fall in the $16 to $38 per hour range depending on employer, experience, and local market.',
    analyticsName: 'cosmetology-apprenticeship',
  }),

  'nail-technician-apprenticeship': programBanner('nail-technician-apprenticeship', {
    pageKey: 'nail-technician-apprenticeship',
    posterImage: '/images/pages/nail-technician.jpg',
    videoSrcDesktop: '/videos/nail-tech.mp4',
    voiceoverSrc: '/audio/heroes/nail-tech.mp3',
    microLabel: 'Nail Tech Apprenticeship',
    belowHeroHeadline: 'Earn your Indiana Nail Technician License while getting paid.',
    belowHeroSubheadline: 'DOL Registered Apprenticeship. 600 hours of supervised training in a licensed salon. Manicure, pedicure, acrylics, and gel nails.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=nail-technician-apprenticeship' },
    secondaryCta: { label: 'Learn More', href: '/contact?program=nail-technician-apprenticeship', variant: 'secondary' },
    trustIndicators: ['DOL Registered Apprenticeship', 'Earn while you train', 'Indiana Nail Tech License', '600 hours training'],
    credentialLabel: 'Indiana Nail Technician License',
    durationLabel: '1 year',
    salaryRangeLabel: '$14 to $30 per hour',
    transcript:
      'Earn Indiana Nail Technician License in 1 year through a registered apprenticeship, building practical skills in manicuring, pedicuring, and nail art. Related entry-level opportunities commonly fall in the $14 to $30 per hour range depending on employer, experience, and local market.',
    analyticsName: 'nail-technician-apprenticeship',
  }),

  'culinary-apprenticeship': programBanner('culinary-apprenticeship', {
    pageKey: 'culinary-apprenticeship',
    posterImage: '/images/pages/culinary.jpg',
    videoSrcDesktop: '/videos/beauty-cosmetology.mp4',
    voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
    microLabel: 'Culinary Apprenticeship',
    belowHeroHeadline: 'Culinary Apprenticeship — earn while you train.',
    belowHeroSubheadline: 'DOL Registered Apprenticeship. Earn ServSafe certification and culinary skills through hands-on training in a professional kitchen.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=culinary-apprenticeship' },
    secondaryCta: { label: 'Learn More', href: '/contact?program=culinary-apprenticeship', variant: 'secondary' },
    trustIndicators: ['DOL Registered Apprenticeship', 'Earn while you train', 'ServSafe certification', 'Professional kitchen training'],
    credentialLabel: 'Culinary Arts Certificate',
    durationLabel: '2 years',
    salaryRangeLabel: '$15 to $28 per hour',
    transcript:
      'Earn Culinary Arts Certificate in 2 years through a registered apprenticeship, building practical skills in food preparation, kitchen safety, and menu planning. Related entry-level opportunities commonly fall in the $15 to $28 per hour range depending on employer, experience, and local market.',
    analyticsName: 'culinary-apprenticeship',
  }),

  'esthetician': programBanner('esthetician', {
    pageKey: 'esthetician',
    posterImage: '/images/pages/barber-apprentice-learning.jpg',
    videoSrcDesktop: '/videos/esthetician-spa.mp4',
    voiceoverSrc: '/audio/heroes/cosmetology.mp3',
    microLabel: 'Esthetician Training',
    belowHeroHeadline: 'Professional Esthetician training in 5 weeks.',
    belowHeroSubheadline: 'Skin analysis, facial treatments, hair removal, and business startup. WIOA funded. ETPL approved.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=esthetician' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'ETPL approved', 'Workforce Ready Grant eligible', 'Business startup included'],
    credentialLabel: 'Indiana Esthetician License',
    durationLabel: '1 year',
    salaryRangeLabel: '$14 to $32 per hour',
    transcript:
      'Earn Indiana Esthetician License in 1 year, building practical skills in skin analysis, facial treatments, and chemical exfoliation. Related entry-level opportunities commonly fall in the $14 to $32 per hour range depending on employer, experience, and local market.',
    analyticsName: 'esthetician',
  }),

  'beauty-career-educator': programBanner('beauty-career-educator', {
    pageKey: 'beauty-career-educator',
    posterImage: '/images/pages/barber-styling-hair.jpg',
    videoSrcDesktop: '/videos/beauty-cosmetology.mp4',
    voiceoverSrc: '/audio/heroes/cosmetology.mp3',
    microLabel: 'Beauty & Education',
    belowHeroHeadline: 'Beauty & Career Educator Training in 12 weeks.',
    belowHeroSubheadline: 'Salon services, peer teaching, entrepreneurship, and workforce readiness. Free with WIOA or Workforce Ready Grant.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=beauty-career-educator' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'ETPL approved', 'Entrepreneurship included', 'Workforce readiness'],
    credentialLabel: 'Cosmetology Instructor License',
    durationLabel: '1 year',
    salaryRangeLabel: '$18 to $35 per hour',
    transcript:
      'Earn Cosmetology Instructor License in 1 year, building practical skills in lesson planning, student assessment, and salon management. Related entry-level opportunities commonly fall in the $18 to $35 per hour range depending on employer, experience, and local market.',
    analyticsName: 'beauty-career-educator',
  }),

  'apprenticeships': {
    pageKey: 'apprenticeships',
    posterImage: '/images/pages/apprenticeships-hero.jpg',
    videoSrcDesktop: '/videos/barber-hero-final.mp4',
    voiceoverSrc: '/audio/heroes/barber.mp3',
    microLabel: 'Earn While You Learn',
    belowHeroHeadline: 'Apprenticeships — get paid to train.',
    belowHeroSubheadline: 'DOL-registered apprenticeships in Barber, Cosmetology, Nail Technician, and Culinary. Earn wages from day one while working toward your license.',
    primaryCta: { label: 'Apply Now', href: '/apply' },
    secondaryCta: { label: 'See All Programs', href: '/programs', variant: 'secondary' },
    trustIndicators: ['DOL Registered Apprenticeship Sponsor', 'Earn while you train', 'Indiana state licenses', 'Job placement assistance'],
    transcript: 'DOL-registered apprenticeships in barbering, cosmetology, nail technology, and culinary arts. Earn while you learn — work in a licensed shop and get paid from day one. Apply at Elevate for Humanity.',
    analyticsName: 'apprenticeships',
  },

  // ── Technology ────────────────────────────────────────────────────────────

  'it-help-desk': programBanner('it-help-desk', {
    pageKey: 'it-help-desk',
    posterImage: '/images/pages/it-helpdesk-desk.jpg',
    videoSrcDesktop: '/videos/it-technology.mp4',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'IT Help Desk',
    belowHeroHeadline: 'IT Help Desk Technician — CompTIA A+ in 8 weeks.',
    belowHeroSubheadline: 'Troubleshoot hardware, software, and networks. Launch your IT career with a 4-Star Indiana Top Job credential. WIOA funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=it-help-desk' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'CompTIA A+ prep', '4-Star Indiana Top Job', 'Starting pay $18–$26/hr'],
    credentialLabel: 'CompTIA A+',
    durationLabel: '8 weeks',
    salaryRangeLabel: '$18 to $28 per hour',
    transcript:
      'Train for CompTIA A+ in 8 weeks, building practical skills in hardware troubleshooting, operating systems, and network connectivity. Related entry-level opportunities commonly fall in the $18 to $28 per hour range depending on employer, experience, and local market.',
    analyticsName: 'it-help-desk',
  }),

  'cybersecurity-analyst': programBanner('cybersecurity-analyst', {
    pageKey: 'cybersecurity-analyst',
    posterImage: '/images/pages/cybersecurity-screen.jpg',
    videoSrcDesktop: '/videos/it-technology.mp4',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'Cybersecurity',
    belowHeroHeadline: 'Cybersecurity Analyst — CompTIA Security+ in 12 weeks.',
    belowHeroSubheadline: 'Protect networks and data from cyber threats. A 5-Star Indiana Top Job. WIOA and Next Level Jobs funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=cybersecurity-analyst' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'CompTIA Security+ prep', '5-Star Indiana Top Job', 'Starting pay $25–$40/hr'],
    credentialLabel: 'CompTIA Security+',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$45,000 to $75,000',
    transcript:
      'Train for CompTIA Security+ in 12 weeks, building practical skills in security fundamentals, threat awareness, and system protection. Related entry-level opportunities commonly fall in the $45,000 to $75,000 range depending on employer, experience, and local market.',
    analyticsName: 'cybersecurity-analyst',
  }),

  'network-administration': programBanner('network-administration', {
    pageKey: 'network-administration',
    posterImage: '/images/pages/network-administration.jpg',
    videoSrcDesktop: '/videos/it-technology.mp4',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'Network Administration',
    belowHeroHeadline: 'Network Administration — CompTIA Network+ in 10 weeks.',
    belowHeroSubheadline: 'Network design, configuration, and troubleshooting. Prepare for CompTIA Network+ certification. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=network-administration' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'CompTIA Network+ prep', 'Next Level Jobs accepted', 'Hands-on lab training'],
    credentialLabel: 'CompTIA Network+',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$20 to $35 per hour',
    transcript:
      'Train for CompTIA Network+ in 10 weeks, building practical skills in network configuration, routing protocols, and infrastructure management. Related entry-level opportunities commonly fall in the $20 to $35 per hour range depending on employer, experience, and local market.',
    analyticsName: 'network-administration',
  }),

  'network-support-technician': programBanner('network-support-technician', {
    pageKey: 'network-support-technician',
    posterImage: '/images/pages/networking-hero.jpg',
    videoSrcDesktop: '/videos/it-technology.mp4',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'Network Support',
    belowHeroHeadline: 'Network Support Technician in 6 weeks.',
    belowHeroSubheadline: 'Entry-level network support and help desk skills. IT Specialist certification in networking. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=network-support-technician' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'IT Specialist certification', 'Next Level Jobs accepted', 'Entry-level friendly'],
    credentialLabel: 'CompTIA Network+',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$18 to $30 per hour',
    transcript:
      'Train for CompTIA Network+ in 10 weeks, building practical skills in cable installation, switch configuration, and help desk support. Related entry-level opportunities commonly fall in the $18 to $30 per hour range depending on employer, experience, and local market.',
    analyticsName: 'network-support-technician',
  }),

  'software-development': programBanner('software-development', {
    pageKey: 'software-development',
    posterImage: '/images/pages/software-development.jpg',
    videoSrcDesktop: '/videos/it-technology.mp4',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'Software Development',
    belowHeroHeadline: 'Software Development Foundations in 12 weeks.',
    belowHeroSubheadline: 'Learn Python, databases, and software engineering fundamentals. Prepare for IT Specialist certifications. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=software-development' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'IT Specialist certifications', 'Python & databases', 'Next Level Jobs accepted'],
    credentialLabel: 'Software Development Certificate',
    durationLabel: '16 weeks',
    salaryRangeLabel: '$45,000 to $80,000',
    transcript:
      'Earn Software Development Certificate in 16 weeks, building practical skills in Python programming, version control, and application deployment. Related entry-level opportunities commonly fall in the $45,000 to $80,000 range depending on employer, experience, and local market.',
    analyticsName: 'software-development',
  }),

  'web-development': programBanner('web-development', {
    pageKey: 'web-development',
    posterImage: '/images/pages/web-development.jpg',
    videoSrcDesktop: '/videos/it-technology.mp4',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'Web Development',
    belowHeroHeadline: 'Web Development — Meta & WordPress certifications in 12 weeks.',
    belowHeroSubheadline: 'Learn HTML, CSS, JavaScript, and WordPress. Prepare for Meta Front-End Developer and WordPress certifications. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=web-development' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'Meta Front-End cert', 'WordPress certification', 'Next Level Jobs accepted'],
    credentialLabel: 'Web Development Certificate',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$40,000 to $70,000',
    transcript:
      'Earn Web Development Certificate in 12 weeks, building practical skills in HTML, CSS, and JavaScript fundamentals. Related entry-level opportunities commonly fall in the $40,000 to $70,000 range depending on employer, experience, and local market.',
    analyticsName: 'web-development',
  }),

  'graphic-design': programBanner('graphic-design', {
    pageKey: 'graphic-design',
    posterImage: '/images/pages/graphic-design.jpg',
    videoSrcDesktop: '/videos/it-technology.mp4',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'Graphic Design',
    belowHeroHeadline: 'Graphic Design — Adobe Certified Professional in 10 weeks.',
    belowHeroSubheadline: 'Learn Adobe Photoshop, Illustrator, and InDesign. Prepare for Adobe Certified Professional credentials. WIOA funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=graphic-design' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'Adobe Certified Professional', 'Photoshop, Illustrator, InDesign', 'Next Level Jobs accepted'],
    credentialLabel: 'Graphic Design Certificate',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$35,000 to $60,000',
    transcript:
      'Earn Graphic Design Certificate in 10 weeks, building practical skills in Adobe Creative Suite, typography, and brand identity. Related entry-level opportunities commonly fall in the $35,000 to $60,000 range depending on employer, experience, and local market.',
    analyticsName: 'graphic-design',
  }),

  'cad-drafting': programBanner('cad-drafting', {
    pageKey: 'cad-drafting',
    posterImage: '/images/pages/cad-drafting.jpg',
    videoSrcDesktop: '/videos/it-technology.mp4',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'CAD / Drafting',
    belowHeroHeadline: 'CAD/Drafting Technician — Autodesk certification in 10 weeks.',
    belowHeroSubheadline: 'Learn AutoCAD and Revit for architectural and mechanical drafting. Prepare for Autodesk Certified User credentials. WIOA funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=cad-drafting' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'Autodesk Certified User', 'AutoCAD & Revit', 'Next Level Jobs accepted'],
    credentialLabel: 'AutoCAD Certification',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$18 to $30 per hour',
    transcript:
      'Earn AutoCAD Certification in 10 weeks, building practical skills in 2D drafting, dimensioning, and technical drawing standards. Related entry-level opportunities commonly fall in the $18 to $30 per hour range depending on employer, experience, and local market.',
    analyticsName: 'cad-drafting',
  }),

  // ── Business & Finance ────────────────────────────────────────────────────

  'tax-preparation': programBanner('tax-preparation', {
    pageKey: 'tax-preparation',
    posterImage: '/images/pages/tax-prep-desk.jpg',
    videoSrcDesktop: '/videos/tax-career-paths.mp4',
    voiceoverSrc: '/audio/heroes/tax.mp3',
    microLabel: 'Tax Preparation',
    belowHeroHeadline: 'Tax Preparation — earn your IRS PTIN in 8 weeks.',
    belowHeroSubheadline: 'Individual and small business tax preparation with real tax software training. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=tax-preparation' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'IRS PTIN credential', 'Real tax software', 'Next Level Jobs accepted'],
    credentialLabel: 'IRS AFSP Certificate',
    durationLabel: '8 weeks',
    salaryRangeLabel: '$15 to $30 per hour',
    transcript:
      'Earn IRS AFSP Certificate in 8 weeks, building practical skills in individual tax returns, deduction identification, and IRS e-filing. Related entry-level opportunities commonly fall in the $15 to $30 per hour range depending on employer, experience, and local market.',
    analyticsName: 'tax-preparation',
  }),

  'bookkeeping': programBanner('bookkeeping', {
    pageKey: 'bookkeeping',
    posterImage: '/images/pages/bookkeeping-ledger.jpg',
    videoSrcDesktop: '/videos/business-finance.mp4',
    voiceoverSrc: '/audio/heroes/business.mp3',
    microLabel: 'Bookkeeping',
    belowHeroHeadline: 'Bookkeeping & QuickBooks — certified in 5 weeks.',
    belowHeroSubheadline: 'Master small business accounting and prepare for the QuickBooks Certified User exam. Flexible payment plans available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=bookkeeping' },
    secondaryCta: { label: 'Payment Plans', href: '/contact?program=bookkeeping', variant: 'secondary' },
    trustIndicators: ['QuickBooks Certified User', 'Small business accounting', 'Flexible payment plans', '5-week program'],
    credentialLabel: 'QuickBooks ProAdvisor',
    durationLabel: '8 weeks',
    salaryRangeLabel: '$18 to $28 per hour',
    transcript:
      'Earn QuickBooks ProAdvisor in 8 weeks, building practical skills in accounts payable, bank reconciliation, and financial reporting. Related entry-level opportunities commonly fall in the $18 to $28 per hour range depending on employer, experience, and local market.',
    analyticsName: 'bookkeeping',
  }),

  'office-administration': programBanner('office-administration', {
    pageKey: 'office-administration',
    posterImage: '/images/pages/office-admin-desk.jpg',
    videoSrcDesktop: '/videos/business-finance.mp4',
    voiceoverSrc: '/audio/heroes/business.mp3',
    microLabel: 'Office Administration',
    belowHeroHeadline: 'Office Administration — Microsoft Office Specialist in 6 weeks.',
    belowHeroSubheadline: 'Master Microsoft Office and business communication. Prepare for Microsoft Office Specialist certifications. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=office-administration' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'Microsoft Office Specialist', 'Business communication', 'Next Level Jobs accepted'],
    credentialLabel: 'Microsoft Office Specialist',
    durationLabel: '6 weeks',
    salaryRangeLabel: '$16 to $24 per hour',
    transcript:
      'Earn Microsoft Office Specialist in 6 weeks, building practical skills in document formatting, spreadsheet management, and business communication. Related entry-level opportunities commonly fall in the $16 to $24 per hour range depending on employer, experience, and local market.',
    analyticsName: 'office-administration',
  }),

  'entrepreneurship': programBanner('entrepreneurship', {
    pageKey: 'entrepreneurship',
    posterImage: '/images/pages/entrepreneurship.jpg',
    videoSrcDesktop: '/videos/business-finance.mp4',
    voiceoverSrc: '/audio/heroes/business.mp3',
    microLabel: 'Entrepreneurship',
    belowHeroHeadline: 'Entrepreneurship & Small Business in 6 weeks.',
    belowHeroSubheadline: 'Business planning, marketing, financial management, and Certiport ESB certification. Evening program. Free with WIOA or grant funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=entrepreneurship' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'Certiport ESB certification', 'Evening schedule', 'Mentorship included'],
    credentialLabel: 'Business Launch Certificate',
    durationLabel: '8 weeks',
    salaryRangeLabel: '$0 to $100,000+',
    transcript:
      'Earn Business Launch Certificate in 8 weeks, building practical skills in business planning, financial projections, and customer acquisition. Related entry-level opportunities commonly fall in the $0 to $100,000+ range depending on employer, experience, and local market.',
    analyticsName: 'entrepreneurship',
  }),

  'business-administration': programBanner('business-administration', {
    pageKey: 'business-administration',
    posterImage: '/images/pages/business-sector.jpg',
    videoSrcDesktop: '/videos/business-finance.mp4',
    voiceoverSrc: '/audio/heroes/business.mp3',
    microLabel: 'Business Administration',
    belowHeroHeadline: 'Business Administration — Certiport certifications in 8 weeks.',
    belowHeroSubheadline: 'Microsoft Office, QuickBooks, and business fundamentals. Prepare for Certiport business certifications. WIOA and Next Level Jobs funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=business-administration' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'Certiport certifications', 'Microsoft Office included', 'Next Level Jobs accepted'],
    credentialLabel: 'Business Administration Certificate',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$18 to $28 per hour',
    transcript:
      'Earn Business Administration Certificate in 10 weeks, building practical skills in operations management, business writing, and organizational systems. Related entry-level opportunities commonly fall in the $18 to $28 per hour range depending on employer, experience, and local market.',
    analyticsName: 'business-administration',
  }),

  'project-management': programBanner('project-management', {
    pageKey: 'project-management',
    posterImage: '/images/pages/project-management.jpg',
    videoSrcDesktop: '/videos/business-finance.mp4',
    voiceoverSrc: '/audio/heroes/business.mp3',
    microLabel: 'Project Management',
    belowHeroHeadline: 'Project Management certification in 6 weeks.',
    belowHeroSubheadline: 'Agile, Scrum, and traditional PM methodologies. Prepare for Certiport Project Management certification. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=project-management' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'Certiport PM certification', 'Agile & Scrum', 'Next Level Jobs accepted'],
    credentialLabel: 'CAPM Certification',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$45,000 to $75,000',
    transcript:
      'Train for CAPM Certification in 10 weeks, building practical skills in project scheduling, risk management, and stakeholder communication. Related entry-level opportunities commonly fall in the $45,000 to $75,000 range depending on employer, experience, and local market.',
    analyticsName: 'project-management',
  }),

  'finance-bookkeeping-accounting': programBanner('finance-bookkeeping-accounting', {
    pageKey: 'finance-bookkeeping-accounting',
    posterImage: '/images/pages/bookkeeping-ledger.jpg',
    videoSrcDesktop: '/videos/tax-career-paths.mp4',
    voiceoverSrc: '/audio/heroes/tax.mp3',
    microLabel: 'Finance & Accounting',
    belowHeroHeadline: 'Finance, Bookkeeping & Accounting credential pathway.',
    belowHeroSubheadline: 'Tiered credentials in tax preparation, bookkeeping, payroll, and accounting. IRS PTIN, QuickBooks Certified User, and Enrolled Agent preparation. Funded for eligible participants.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=finance-bookkeeping-accounting' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'IRS PTIN credential', 'QuickBooks Certified User', 'Enrolled Agent prep'],
    credentialLabel: 'Accounting Technician Certificate',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$18 to $30 per hour',
    transcript:
      'Earn Accounting Technician Certificate in 12 weeks, building practical skills in general ledger, payroll processing, and financial statements. Related entry-level opportunities commonly fall in the $18 to $30 per hour range depending on employer, experience, and local market.',
    analyticsName: 'finance-bookkeeping-accounting',
  }),

  // ── Peer Recovery ─────────────────────────────────────────────────────────

  'peer-recovery-specialist': programBanner('peer-recovery-specialist', {
    pageKey: 'peer-recovery-specialist',
    posterImage: '/images/pages/peer-recovery.jpg',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    voiceoverSrc: '/audio/heroes/dsp.mp3',
    microLabel: 'Peer Recovery',
    belowHeroHeadline: 'Become a Certified Peer Recovery Specialist.',
    belowHeroSubheadline: 'Indiana CPRS training. Support individuals in recovery and behavioral health programs. WIOA funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=peer-recovery-specialist' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'Indiana CPRS credential', 'JRI funding eligible', 'Job placement assistance'],
    credentialLabel: 'CPRS Certification',
    durationLabel: '8 weeks',
    salaryRangeLabel: '$16 to $24 per hour',
    transcript:
      'Train for CPRS Certification in 8 weeks, building practical skills in motivational interviewing, recovery planning, and crisis support. Related entry-level opportunities commonly fall in the $16 to $24 per hour range depending on employer, experience, and local market.',
    analyticsName: 'peer-recovery-specialist',
  }),

  'technology': {
    pageKey: 'technology',
    posterImage: '/images/pages/technology-sector.jpg',
    videoSrcDesktop: '/videos/it-technology.mp4',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'Technology Programs',
    belowHeroHeadline: 'Technology training with industry certifications.',
    belowHeroSubheadline: 'IT Help Desk, Cybersecurity, Web Development, Software Development, and more. WIOA and Next Level Jobs funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=technology' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'CompTIA & Adobe certifications', 'Next Level Jobs accepted', 'Job placement assistance'],
    transcript: 'IT Support, Cybersecurity, Web Development, and more. Earn industry certifications for high-demand tech careers. Funding available through WIOA and Next Level Jobs. Launch your technology career at Elevate for Humanity.',
    analyticsName: 'technology',
  },

  'business': {
    pageKey: 'business',
    posterImage: '/images/pages/business-sector.jpg',
    videoSrcDesktop: '/videos/business-finance.mp4',
    voiceoverSrc: '/audio/heroes/business.mp3',
    microLabel: 'Business Programs',
    belowHeroHeadline: 'Business training for professional careers.',
    belowHeroSubheadline: 'Tax preparation, bookkeeping, office administration, entrepreneurship, and project management. WIOA and Next Level Jobs funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=business' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'Certiport certifications', 'IRS PTIN credential', 'Next Level Jobs accepted'],
    transcript: 'Tax preparation, financial services, and business startup training. Learn to run your own business with real-world skills and mentorship. WIOA funding available. Apply at Elevate for Humanity.',
    analyticsName: 'business',
  },
};

export default heroBanners;

/** Typed lookup — throws at build time if pageKey is wrong */
export function getHeroBanner(pageKey: keyof typeof heroBanners): HeroBannerConfig {
  const config = heroBanners[pageKey];
  if (!config) throw new Error(`No hero banner config found for pageKey: "${pageKey}"`);
  return config;
}

/**
 * Validated internal program banners only.
 * Every entry has passed programBanner() at module load time.
 * Import this in audit scripts and program pages.
 */
export const internalProgramHeroBanners = Object.fromEntries(
  Object.entries(heroBanners).filter(([, v]) => v.credentialLabel !== undefined)
) as Record<string, HeroBannerConfig>;

/**
 * Category / sector banners — not subject to programBanner() validation.
 * Used on sector landing pages (healthcare, trades, technology, etc.)
 */
export const categoryHeroBanners = Object.fromEntries(
  Object.entries(heroBanners).filter(([, v]) => v.credentialLabel === undefined)
) as Record<string, HeroBannerConfig>;
