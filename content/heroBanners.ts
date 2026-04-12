/**
 * heroBanners.ts — centralized content model for all hero video banners.
 *
 * Rules (non-negotiable):
 * - No headline, subheadline, or CTA belongs on the video frame.
 * - belowHeroHeadline / belowHeroSubheadline render BELOW the video.
 * - transcript is the full read-aloud voiceover script — not a summary.
 * - microLabel is 2–4 words max, rendered discreetly on the video frame.
 * - All pages must reference this file — no page-level hero content duplication.
 *
 * Internal program pages (workforce programs, LMS-backed offerings) MUST
 * satisfy ProgramHeroBannerConfig — all fields required, no exceptions.
 * Category/partner/external pages may use HeroBannerConfig with optional fields.
 *
 * Script alignment rules for internal programs:
 * - transcript must name the specific certification outcome (e.g. "EPA 608 Universal")
 * - transcript must state time to completion
 * - transcript must name the job pathway
 * - transcript must state funding eligibility if applicable
 * - CTAs must match program state: Apply Now | Join Waitlist | Request Info only
 */

export interface HeroBannerCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface HeroBannerConfig {
  pageKey: string;
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

// ── Banned phrases — rejected in all internal program transcripts ─────────
const BANNED_PHRASES = [
  'rewarding career', 'exciting future', 'in-demand', 'career-ready',
  'next step', 'start your journey', 'launch your career', 'transform your life',
  'bright future', 'take the next step',
];

/**
 * Enforced schema for internal workforce program pages.
 *
 * Salary handling — two explicit paths, no silent bypass:
 *
 *   Normal program:
 *     salaryExempt: false (or omitted)
 *     salaryRangeLabel: "$38,000 to $52,000"   ← must appear verbatim in transcript
 *
 *   Exempt program (bundled cert, no direct salary outcome):
 *     salaryExempt: true
 *     salaryNote: "reason why salary is not the primary outcome signal"
 *     salaryRangeLabel: omitted or ''           ← not checked in transcript
 *
 * credentialLabel — exact credential name as it appears in the transcript
 * durationLabel   — exact duration string as it appears in the transcript
 *                   Must contain a numeric value (e.g. "10 weeks", "2,000 hours")
 * salaryRangeLabel — exact salary string as it appears in the transcript
 *                   Must match $NN,NNN format when present
 */
export type ProgramHeroBannerConfig = {
  pageKey: string;
  videoSrcDesktop: string;
  microLabel: string;
  credentialLabel: string;
  durationLabel: string;
  belowHeroHeadline: string;
  belowHeroSubheadline: string;
  primaryCta: HeroBannerCta;
  secondaryCta: HeroBannerCta;
  trustIndicators: string[];
  transcript: string;
  analyticsName: string;
} & (
  | { salaryExempt?: false; salaryRangeLabel: string }
  | { salaryExempt: true;  salaryNote: string; salaryRangeLabel?: string }
);

function fail(slug: string, msg: string): never {
  throw new Error(`[heroBanners] "${slug}": ${msg}`);
}

/** Validates that durationLabel contains a numeric value. */
function validateDuration(slug: string, label: string): void {
  if (!/\d+/.test(label))
    fail(slug, `durationLabel "${label}" must contain a numeric value (e.g. "10 weeks", "2,000 hours")`);
}

/** Validates that salaryRangeLabel matches $NN,NNN currency format. */
function validateSalary(slug: string, label: string): void {
  if (!/\$\d{2,3},?\d{3}/.test(label))
    fail(slug, `salaryRangeLabel "${label}" must include valid currency format (e.g. "$38,000 to $52,000")`);
}

/**
 * Validates a program banner at module load. Throws immediately on any violation.
 *
 * Rules:
 *   credentialLabel: required, non-empty
 *   durationLabel: required, must contain a numeric value
 *   salaryRangeLabel: required unless salaryExempt:true (must then have salaryNote)
 *   salaryRangeLabel: must match $NN,NNN format when present
 *   microLabel: max 4 words
 *   trustIndicators: 4–6 unique items
 *   transcript: 180–360 chars
 *   transcript: contains credentialLabel verbatim
 *   transcript: contains durationLabel verbatim
 *   transcript: contains salaryRangeLabel verbatim (unless salaryExempt:true)
 *   transcript: no banned marketing phrases
 *   transcript: ends with sentence punctuation
 */
function programBanner(slug: string, config: ProgramHeroBannerConfig): ProgramHeroBannerConfig {
  const { microLabel, credentialLabel, durationLabel, trustIndicators, transcript } = config;

  // ── Required scalar fields ────────────────────────────────────────────────
  if (!credentialLabel?.trim()) fail(slug, 'credentialLabel is required');
  if (!durationLabel?.trim())   fail(slug, 'durationLabel is required');

  // ── Salary: explicit exemption model ─────────────────────────────────────
  if (config.salaryExempt === true) {
    if (!config.salaryNote?.trim())
      fail(slug, 'salaryExempt programs must include a non-empty salaryNote explaining why');
  } else {
    const sal = config.salaryRangeLabel;
    if (!sal?.trim())
      fail(slug, 'salaryRangeLabel is required — set salaryExempt:true with salaryNote to exempt');
    validateSalary(slug, sal);
  }

  // ── Numeric validation ────────────────────────────────────────────────────
  validateDuration(slug, durationLabel);

  // ── microLabel: max 4 words ───────────────────────────────────────────────
  if (microLabel.trim().split(/\s+/).length > 4)
    fail(slug, `microLabel "${microLabel}" exceeds 4 words`);

  // ── trustIndicators: 4–6 unique items ────────────────────────────────────
  if (!Array.isArray(trustIndicators) || trustIndicators.length < 4 || trustIndicators.length > 6)
    fail(slug, `trustIndicators must be 4–6 items (got ${trustIndicators?.length ?? 0})`);
  const deduped = new Set(trustIndicators.map((x) => x.trim().toLowerCase()));
  if (deduped.size !== trustIndicators.length)
    fail(slug, 'trustIndicators must not contain duplicates');

  // ── Transcript: length ────────────────────────────────────────────────────
  if (transcript.length < 180 || transcript.length > 360)
    fail(slug, `transcript is ${transcript.length} chars — must be 180–360`);

  // ── Transcript: verbatim label checks ────────────────────────────────────
  if (!transcript.includes(credentialLabel))
    fail(slug, `transcript must include credentialLabel "${credentialLabel}" verbatim`);
  if (!transcript.includes(durationLabel))
    fail(slug, `transcript must include durationLabel "${durationLabel}" verbatim`);
  if (config.salaryExempt !== true) {
    const sal = config.salaryRangeLabel;
    if (!transcript.includes(sal))
      fail(slug, `transcript must include salaryRangeLabel "${sal}" verbatim`);
  }

  // ── Transcript: no banned phrases ────────────────────────────────────────
  const hit = BANNED_PHRASES.find((p) => transcript.toLowerCase().includes(p));
  if (hit) fail(slug, `transcript contains banned phrase: "${hit}"`);

  // ── Transcript: ends with punctuation ────────────────────────────────────
  if (!/[.?!]$/.test(transcript.trim()))
    fail(slug, 'transcript must end with sentence punctuation');

  return config;
}

/**
 * Generates a consistent, validator-compliant transcript from structured fields.
 * Self-validates after generation — throws if the output would fail programBanner().
 *
 * Use this for new banners. Manual transcripts are allowed but must still pass
 * the verbatim label checks in programBanner().
 */
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
  const skillText = skills.filter(Boolean).join(', ');
  const t = `Train for ${credentialLabel} in ${durationLabel}, building skills in ${skillText}. Related roles commonly earn ${salaryRangeLabel} depending on employer, experience, and market.`;

  // Self-validate — generator cannot produce invalid output
  if (!t.includes(credentialLabel))
    throw new Error(`[buildTranscript] generator drift: credentialLabel "${credentialLabel}" missing from output`);
  if (!t.includes(durationLabel))
    throw new Error(`[buildTranscript] generator drift: durationLabel "${durationLabel}" missing from output`);
  if (!t.includes(salaryRangeLabel))
    throw new Error(`[buildTranscript] generator drift: salaryRangeLabel "${salaryRangeLabel}" missing from output`);
  if (t.length < 180 || t.length > 360)
    throw new Error(`[buildTranscript] generated transcript is ${t.length} chars — must be 180–360. Adjust skills text.`);

  return t;
}



const heroBanners: Record<string, HeroBannerConfig> = {
  home: {
    pageKey: 'home',
    videoSrcDesktop: '/videos/homepage-hero-montage.mp4',
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
    videoSrcDesktop: '/videos/about-mission.mp4',
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
    videoSrcDesktop: '/videos/training-providers-hero.mp4',
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
    // orientation-full.mp4 used until a dedicated funding hero video is produced
    videoSrcDesktop: '/videos/orientation-full.mp4',
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
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
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
    videoSrcDesktop: '/videos/lms-learning.mp4',
    videoSrcMobile: '/videos/store-demo-narrated.mp4',
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
    videoSrcDesktop: '/videos/program-hero.mp4',
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

  learner: {
    pageKey: 'learner',
    videoSrcDesktop: '/videos/dashboard-student-narrated.mp4',
    voiceoverSrc: '/audio/heroes/learner.mp3',
    microLabel: 'Your Training',
    belowHeroHeadline: 'Your credential is the goal. Everything here moves you toward it.',
    belowHeroSubheadline:
      'Complete your lessons, pass your checkpoints, and earn the credential your employer will verify. Your progress is tracked automatically.',
    primaryCta: { label: 'Continue Training', href: '/lms/courses' },
    secondaryCta: { label: 'Check My Progress', href: '/learner/dashboard', variant: 'secondary' },
    trustIndicators: [
      'Progress tracked automatically',
      'Credentials issued on completion',
      'Employer-verified outcomes',
      'Support available throughout',
    ],
    transcript:
      'Welcome to Elevate. Your program is structured, your progress is tracked, and your credential is waiting at the finish line. Complete each lesson, pass your checkpoints, and your certification is issued automatically. If you need help at any point, your advisor is one message away.',
    analyticsName: 'learner',
  },

  'skilled-trades': {
    pageKey: 'skilled-trades',
    videoSrcDesktop: '/videos/electrician-trades.mp4',
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

  // ── Internal program pages — ProgramHeroBannerConfig enforced ────────────

  'hvac-technician': programBanner('hvac-technician', {
    pageKey: 'hvac-technician',
    videoSrcDesktop: '/videos/hvac-hero-final.mp4',
    posterImage: '/hero-images/skilled-trades-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
    microLabel: 'EPA 608 Universal',
    credentialLabel: 'EPA 608 Universal',
    durationLabel: '20 weeks',
    salaryRangeLabel: '$38,000 to $55,000',
    belowHeroHeadline: 'HVAC Technician — EPA 608 Universal in 20 weeks.',
    belowHeroSubheadline: 'Hands-on training with real HVAC systems. Earn EPA 608 Universal, OSHA 30, CPR, and Rise Up. Proctored on-site. Total cost $5,000 — most students pay $0 through the Workforce Ready Grant.',
    primaryCta: { label: 'Apply Now', href: '/programs/hvac-technician/apply' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['EPA 608 proctored on-site', 'Workforce Ready Grant eligible — $0 for most', 'OSHA 30 + CPR + Rise Up', 'Job placement assistance'],
    transcript: 'Train for EPA 608 Universal certification in 20 weeks at Elevate for Humanity, working on real HVAC systems with hands-on instruction. Graduates also earn OSHA 30, CPR, and Rise Up credentials. HVAC technicians in Indiana commonly earn $38,000 to $55,000. Total program cost is $5,000 — most students pay $0 through the Workforce Ready Grant.',
    analyticsName: 'hvac-technician',
  }),

  'cdl-training': programBanner('cdl-training', {
    pageKey: 'cdl-training',
    videoSrcDesktop: '/videos/cdl-hero.mp4',
    posterImage: '/hero-images/cdl-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/cdl.mp3',
    microLabel: 'CDL Class A',
    credentialLabel: 'CDL Class A',
    durationLabel: '3 to 6 weeks',
    salaryRangeLabel: '$50,000 to $65,000',
    belowHeroHeadline: 'CDL Class A License in 3–6 weeks.',
    belowHeroSubheadline: 'Behind-the-wheel training at our Indianapolis facility. Earn your CDL Class A, DOT Medical Card, and OSHA 10. WIOA covers tuition, DOT physical, drug screen, and exam fees for eligible Indiana residents.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=cdl-training' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA covers exam + DOT physical', 'CDL Class A + DOT Medical Card', 'Werner, Schneider, FedEx hiring', 'Starting pay $50K–$65K'],
    transcript: 'Train for CDL Class A licensure in 3 to 6 weeks at Elevate for Humanity in Indianapolis, with behind-the-wheel instruction, pre-trip inspection, and on-site skills testing. CDL drivers commonly earn $50,000 to $65,000. WIOA covers tuition, DOT physical, drug screen, and exam fees for eligible Indiana residents.',
    analyticsName: 'cdl-training',
  }),

  'electrical': programBanner('electrical', {
    pageKey: 'electrical',
    videoSrcDesktop: '/videos/electrician-trades.mp4',
    posterImage: '/hero-images/electrical-hero.jpg',
    voiceoverSrc: '/audio/heroes/electrical.mp3',
    microLabel: 'NCCER Core Curriculum',
    credentialLabel: 'NCCER Core Curriculum',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$35,000 to $45,000',
    belowHeroHeadline: 'Electrical Technician — OSHA 30 + NCCER in 12 weeks.',
    belowHeroSubheadline: 'Residential and commercial wiring, NEC code, load calculations, and conduit bending. Graduate with OSHA 30 Construction and NCCER Core Curriculum. WIOA and Next Level Jobs funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=electrical' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA + Next Level Jobs eligible', 'OSHA 30 Construction', 'NCCER Core Curriculum', 'Apprenticeship pathway available'],
    transcript: 'Train for NCCER Core Curriculum and OSHA 30 Construction credentials in 12 weeks, building skills in residential wiring, NEC code, load calculations, and conduit bending. Entry-level electrician helpers commonly earn $35,000 to $45,000. WIOA and Next Level Jobs funding available for eligible Indiana residents.',
    analyticsName: 'electrical',
  }),

  'welding': programBanner('welding', {
    pageKey: 'welding',
    videoSrcDesktop: '/videos/welding-trades.mp4',
    posterImage: '/hero-images/skilled-trades-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/welding.mp3',
    microLabel: 'AWS D1.1 Certification',
    credentialLabel: 'AWS D1.1',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$38,000 to $62,000',
    belowHeroHeadline: 'Welding Technology — AWS D1.1 certification in 10 weeks.',
    belowHeroSubheadline: 'MIG, TIG, and stick welding on structural steel. AWS D1.1 tested by a Certified Welding Inspector. OSHA 10 included. WIOA and Next Level Jobs funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=welding' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA + Next Level Jobs eligible', 'AWS D1.1 — CWI proctored', 'OSHA 10 Construction', 'Welder pay $38K–$62K'],
    transcript: 'Train for AWS D1.1 certification in 10 weeks, building MIG, TIG, and stick welding skills on structural steel. Testing is conducted by a Certified Welding Inspector at an AWS Authorized Test Facility. Welders commonly earn $38,000 to $62,000. WIOA and Next Level Jobs funding available for eligible Indiana residents.',
    analyticsName: 'welding',
  }),

  'plumbing': programBanner('plumbing', {
    pageKey: 'plumbing',
    videoSrcDesktop: '/videos/welding-trades.mp4',
    posterImage: '/hero-images/skilled-trades-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
    microLabel: 'NCCER Core Curriculum',
    credentialLabel: 'NCCER Core Curriculum',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$36,000 to $52,000',
    belowHeroHeadline: 'Plumbing Technician — OSHA 10 + NCCER in 10 weeks.',
    belowHeroSubheadline: 'Residential and commercial plumbing systems, pipe fitting, and code compliance. Graduate with OSHA 10 Construction and NCCER Core Curriculum. WIOA and Next Level Jobs funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=plumbing' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA + Next Level Jobs eligible', 'OSHA 10 Construction', 'NCCER Core Curriculum', 'Apprenticeship pathway available'],
    transcript: 'Train for NCCER Core Curriculum and OSHA 10 Construction credentials in 10 weeks, building skills in residential and commercial plumbing systems, pipe fitting, and code compliance. Plumbing helpers commonly earn $36,000 to $52,000. WIOA and Next Level Jobs funding available for eligible Indiana residents.',
    analyticsName: 'plumbing',
  }),

  'diesel-mechanic': programBanner('diesel-mechanic', {
    pageKey: 'diesel-mechanic',
    videoSrcDesktop: '/videos/welding-trades.mp4',
    posterImage: '/hero-images/skilled-trades-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
    microLabel: 'ASE Exam Prep',
    credentialLabel: 'ASE exam preparation',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$42,000 to $58,000',
    belowHeroHeadline: 'Diesel Mechanic — OSHA 10 + ASE prep in 12 weeks.',
    belowHeroSubheadline: 'Diagnose and repair diesel engines, transmissions, and hydraulic systems. OSHA 10 and ASE exam preparation included. WIOA and Next Level Jobs funding available.',
    primaryCta: { label: 'Request Information', href: '/contact?program=diesel-mechanic' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA + Next Level Jobs eligible', 'OSHA 10 Construction', 'ASE exam preparation', 'Diesel tech pay $42K–$58K'],
    transcript: 'Train for ASE exam preparation and OSHA 10 Construction credentials in 12 weeks, building skills in diesel engine diagnosis, transmission repair, and hydraulic systems. Diesel technicians commonly earn $42,000 to $58,000. WIOA and Next Level Jobs funding available for eligible Indiana residents.',
    analyticsName: 'diesel-mechanic',
  }),

  'construction-trades-certification': programBanner('construction-trades-certification', {
    pageKey: 'construction-trades-certification',
    videoSrcDesktop: '/videos/electrician-trades.mp4',
    posterImage: '/hero-images/skilled-trades-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
    microLabel: 'OSHA 30 + Forklift',
    credentialLabel: 'OSHA 30 Construction',
    durationLabel: '8 weeks',
    salaryRangeLabel: '$32,000 to $48,000',
    belowHeroHeadline: 'Construction Trades Certification — OSHA 30 + EPA 608 + Forklift in 8 weeks.',
    belowHeroSubheadline: 'Multi-trade foundation for construction careers. Earn OSHA 30 Construction, EPA 608, and Forklift Operator Certification. WIOA and Next Level Jobs funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=construction-trades-certification' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA + Next Level Jobs eligible', 'OSHA 30 Construction', 'EPA 608 + Forklift cert', 'Self-pay $3,800'],
    transcript: 'Earn OSHA 30 Construction, EPA 608, and Forklift Operator Certification in 8 weeks — a multi-credential foundation for construction, HVAC, and logistics work. Entry-level construction workers commonly earn $32,000 to $48,000. WIOA and Next Level Jobs funding available for eligible Indiana residents.',
    analyticsName: 'construction-trades-certification',
  }),

  'forklift': programBanner('forklift', {
    pageKey: 'forklift',
    videoSrcDesktop: '/videos/electrician-trades.mp4',
    posterImage: '/hero-images/skilled-trades-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
    microLabel: 'OSHA Forklift Cert',
    credentialLabel: 'OSHA 29 CFR 1910.178',
    durationLabel: '1 week',
    salaryExempt: true,
    salaryNote: 'Short standalone cert; wage outcome depends entirely on employer and role — not attributable to this cert alone.',
    belowHeroHeadline: 'Forklift Operator Certification in 1 week.',
    belowHeroSubheadline: 'OSHA 29 CFR 1910.178 compliant. Hands-on training on sit-down, stand-up, and reach truck forklifts. Certification valid 3 years. WIOA funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=forklift' },
    secondaryCta: { label: 'View Schedule', href: '/contact?program=forklift', variant: 'secondary' },
    trustIndicators: ['OSHA 29 CFR 1910.178 compliant', 'Sit-down, stand-up, reach truck', 'Cert valid 3 years', 'WIOA funding available'],
    transcript: 'Earn OSHA 29 CFR 1910.178 compliant Forklift Operator Certification in 1 week at Elevate for Humanity. Training covers sit-down, stand-up, and reach truck forklifts. Certification is valid for 3 years and accepted by warehousing, logistics, and manufacturing employers. Self-pay is $500. WIOA funding available.',
    analyticsName: 'forklift',
  }),

  'cna': programBanner('cna', {
    pageKey: 'cna',
    videoSrcDesktop: '/videos/cna-hero.mp4',
    posterImage: '/hero-images/healthcare-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/cna.mp3',
    microLabel: 'Indiana CNA Certification',
    credentialLabel: 'Indiana CNA certification',
    durationLabel: '6 weeks',
    salaryRangeLabel: '$30,000 to $40,000',
    belowHeroHeadline: 'Certified Nursing Assistant — Indiana state exam on-site.',
    belowHeroSubheadline: 'Indiana state CNA certification exam proctored on-site. Clinical rotations at licensed healthcare facilities. WIOA and Workforce Ready Grant funding available. Join the waitlist for the next cohort.',
    primaryCta: { label: 'Join Waitlist', href: '/programs/cna#waitlist' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Indiana state exam on-site', 'WIOA + Workforce Ready Grant', 'Clinical rotations included', 'ETPL approved'],
    transcript: 'Prepare for Indiana CNA certification in 6 weeks, completing clinical rotations at licensed healthcare facilities with the state exam proctored on-site. CNAs in Indiana commonly earn $30,000 to $40,000. WIOA and Workforce Ready Grant funding available for eligible Indiana residents. Join the waitlist for the next cohort.',
    analyticsName: 'cna',
  }),

  'medical-assistant': programBanner('medical-assistant', {
    pageKey: 'medical-assistant',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    posterImage: '/hero-images/healthcare-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/medical-assistant.mp3',
    microLabel: 'NHA CCMA Certification',
    credentialLabel: 'NHA CCMA',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$35,000 to $45,000',
    belowHeroHeadline: 'Medical Assistant — NHA CCMA certification in 12 weeks.',
    belowHeroSubheadline: 'Clinical procedures, patient intake, EHR documentation, and phlebotomy. Prepare for the NHA CCMA and CPT exams. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=medical-assistant' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'NHA CCMA + CPT exams', 'Clinical rotations included', 'MA pay $35K–$45K'],
    transcript: 'Train for NHA CCMA and CPT certification in 12 weeks, building skills in clinical procedures, patient intake, EHR documentation, and phlebotomy. Medical assistants commonly earn $35,000 to $45,000. Free with WIOA or Next Level Jobs funding for eligible Indiana residents.',
    analyticsName: 'medical-assistant',
  }),

  'pharmacy-technician': programBanner('pharmacy-technician', {
    pageKey: 'pharmacy-technician',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    posterImage: '/hero-images/healthcare-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/healthcare.mp3',
    microLabel: 'PTCB CPhT Prep',
    credentialLabel: 'PTCB CPhT',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$34,000 to $46,000',
    belowHeroHeadline: 'Pharmacy Technician — PTCB CPhT exam prep in 10 weeks.',
    belowHeroSubheadline: 'Medication dispensing, pharmacy law, sterile compounding, and inventory management. Prepare for the PTCB CPhT exam. Free with WIOA funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=pharmacy-technician' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA funding', 'PTCB CPhT exam prep', 'Next Level Jobs accepted', 'Pharm tech pay $34K–$46K'],
    transcript: 'Train for PTCB CPhT certification in 10 weeks, building skills in medication dispensing, pharmacy law, sterile compounding, and inventory management. Pharmacy technicians commonly earn $34,000 to $46,000. Free with WIOA funding for eligible Indiana residents. Self-pay is $4,200 with payment plans available.',
    analyticsName: 'pharmacy-technician',
  }),

  'phlebotomy': programBanner('phlebotomy', {
    pageKey: 'phlebotomy',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    posterImage: '/hero-images/healthcare-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/healthcare.mp3',
    microLabel: 'NHA CPT Certification',
    credentialLabel: 'NHA CPT',
    durationLabel: '4 weeks',
    salaryRangeLabel: '$30,000 to $40,000',
    belowHeroHeadline: 'Phlebotomy Technician — NHA CPT certification in 4 weeks.',
    belowHeroSubheadline: '120 hours of classroom and clinical training. Prepare for the NHA CPT exam. Enter healthcare in 4 weeks. Self-pay $1,500 with payment plans.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=phlebotomy' },
    secondaryCta: { label: 'Payment Plans', href: '/contact?program=phlebotomy', variant: 'secondary' },
    trustIndicators: ['NHA CPT exam prep', '120 hours clinical training', 'Self-pay $1,500', 'Flexible payment plans'],
    transcript: 'Train for NHA CPT certification in 4 weeks, completing 120 hours of classroom and clinical training in venipuncture, specimen processing, and patient interaction. Phlebotomy technicians commonly earn $30,000 to $40,000. The NHA CPT is the employer-accepted standard in Indiana. Self-pay is $1,500 with payment plans available.',
    analyticsName: 'phlebotomy',
  }),

  'home-health-aide': programBanner('home-health-aide', {
    pageKey: 'home-health-aide',
    videoSrcDesktop: '/videos/cna-hero.mp4',
    posterImage: '/hero-images/healthcare-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/healthcare.mp3',
    microLabel: 'Indiana HHA Certification',
    credentialLabel: 'Indiana HHA certification',
    durationLabel: '4 weeks',
    salaryRangeLabel: '$26,000 to $36,000',
    belowHeroHeadline: 'Home Health Aide — Indiana HHA + CCHW in 4 weeks.',
    belowHeroSubheadline: 'Indiana state HHA certification and CCHW credential for in-home and community care careers. Free with WIOA or Workforce Ready Grant.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=home-health-aide' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + WRG', 'Indiana HHA state cert', 'CCHW credential', 'ETPL approved'],
    transcript: 'Earn Indiana HHA certification and the CCHW credential in 4 weeks, preparing for in-home and community care work with licensed agencies. Home health aides commonly earn $26,000 to $36,000. Free with WIOA or Workforce Ready Grant for eligible Indiana residents.',
    analyticsName: 'home-health-aide',
  }),

  'emergency-health-safety': programBanner('emergency-health-safety', {
    pageKey: 'emergency-health-safety',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    posterImage: '/hero-images/healthcare-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/cpr.mp3',
    microLabel: 'NREMT EMR Certification',
    credentialLabel: 'NREMT Emergency Medical Responder',
    durationLabel: '4 weeks',
    salaryRangeLabel: '$32,000 to $45,000',
    belowHeroHeadline: 'Emergency Health & Safety — NREMT EMR + OSHA 10 in 4 weeks.',
    belowHeroSubheadline: 'NREMT Emergency Medical Responder, CPR/AED, First Aid, and OSHA 10 certifications. Free with WIOA or Workforce Ready Grant.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=emergency-health-safety' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + WRG', 'NREMT EMR certification', 'OSHA 10 + CPR/AED', 'ETPL approved'],
    transcript: 'Earn NREMT Emergency Medical Responder, CPR/AED, First Aid, and OSHA 10 credentials in 4 weeks. Emergency health and safety roles commonly earn $32,000 to $45,000. Free with WIOA or Workforce Ready Grant for eligible Indiana residents. Self-pay is $4,950.',
    analyticsName: 'emergency-health-safety',
  }),

  'cpr-first-aid': programBanner('cpr-first-aid', {
    pageKey: 'cpr-first-aid',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    posterImage: '/hero-images/healthcare-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/cpr.mp3',
    microLabel: 'HSI Certified',
    credentialLabel: 'HSI-certified CPR, AED, and First Aid',
    durationLabel: '1 day',
    salaryExempt: true,
    salaryNote: 'Bundled prerequisite cert included free with all Elevate programs; $130 standalone. No direct salary outcome — strengthens employability across roles.',
    belowHeroHeadline: 'CPR & First Aid — HSI certified, train from home.',
    belowHeroSubheadline: 'Live instructor. Mannequin shipped to your door. HSI-certified CPR, AED, and First Aid for healthcare, education, and licensed professions. $130. Included free with all Elevate programs.',
    primaryCta: { label: 'Enroll Now', href: '/apply?program=cpr-first-aid' },
    secondaryCta: { label: 'Learn More', href: '/contact?program=cpr-first-aid', variant: 'secondary' },
    trustIndicators: ['HSI certified', 'Mannequin shipped to you', 'Live instructor online', 'Free with Elevate programs'],
    transcript: 'Earn HSI-certified CPR, AED, and First Aid certification in 1 day from home — a mannequin ships to your door and a live instructor guides the skills session. Accepted for healthcare, education, childcare, and licensed professions. $130 self-pay. Included free with any Elevate training program.',
    analyticsName: 'cpr-first-aid',
  }),

  'sanitation-infection-control': programBanner('sanitation-infection-control', {
    pageKey: 'sanitation-infection-control',
    videoSrcDesktop: '/videos/healthcare-cna.mp4',
    posterImage: '/hero-images/healthcare-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/healthcare.mp3',
    microLabel: 'ServSafe + Bloodborne',
    credentialLabel: 'ServSafe Food Handler',
    durationLabel: '2 weeks',
    salaryExempt: true,
    salaryNote: 'Bundled prerequisite cert included free with Elevate programs; $400 standalone. Required credential for entry into healthcare/food service — not a standalone career program.',
    belowHeroHeadline: 'Sanitation & Infection Control — ServSafe + Bloodborne Pathogens in 2 weeks.',
    belowHeroSubheadline: 'ServSafe Food Handler and OSHA-compliant Bloodborne Pathogens certifications. Required for healthcare, food service, and personal services. Included free with Elevate programs.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=sanitation-infection-control' },
    secondaryCta: { label: 'Learn More', href: '/contact?program=sanitation-infection-control', variant: 'secondary' },
    trustIndicators: ['ServSafe Food Handler', 'OSHA Bloodborne Pathogens', 'Included with programs', 'Self-pay $400'],
    transcript: 'Earn ServSafe Food Handler and OSHA-compliant Bloodborne Pathogens certifications in 2 weeks. Both credentials are required for healthcare, food service, and personal services work. Included free with any Elevate training program. Self-pay is $400.',
    analyticsName: 'sanitation-infection-control',
  }),

  'barber-apprenticeship': programBanner('barber-apprenticeship', {
    pageKey: 'barber-apprenticeship',
    videoSrcDesktop: '/videos/barber-hero-final.mp4',
    posterImage: '/hero-images/barber-hero.jpg',
    voiceoverSrc: '/audio/heroes/barber.mp3',
    microLabel: 'DOL Registered Apprenticeship',
    credentialLabel: 'Indiana Barber License',
    durationLabel: '2,000 hours',
    salaryRangeLabel: '$28,000 to $52,000',
    belowHeroHeadline: 'Earn your Indiana Barber License while getting paid.',
    belowHeroSubheadline: 'DOL Registered Apprenticeship. 2,000 hours — 1,500 OJT in a licensed barbershop + 500 RTI. Earn wages from day one. Graduate with your Indiana Barber License.',
    primaryCta: { label: 'Apply Now', href: '/programs/barber-apprenticeship/apply' },
    secondaryCta: { label: 'Find a Host Shop', href: '/programs/barber-apprenticeship/host-shops', variant: 'secondary' },
    trustIndicators: ['DOL Registered Apprenticeship', 'Earn wages from day one', 'Indiana Barber License', 'Barbershop Business Certificate'],
    transcript: 'Earn your Indiana Barber License through a DOL Registered Apprenticeship — 2,000 hours of training, 1,500 of which are paid on-the-job at a licensed barbershop. Barbers commonly earn $28,000 to $52,000 depending on clientele and setting. Wages begin on day one.',
    analyticsName: 'barber-apprenticeship',
  }),

  'cosmetology-apprenticeship': programBanner('cosmetology-apprenticeship', {
    pageKey: 'cosmetology-apprenticeship',
    videoSrcDesktop: '/videos/beauty-cosmetology.mp4',
    posterImage: '/hero-images/barber-beauty-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/cosmetology.mp3',
    microLabel: 'DOL Registered Apprenticeship',
    credentialLabel: 'Indiana Cosmetology License',
    durationLabel: '2,000 hours',
    salaryRangeLabel: '$26,000 to $48,000',
    belowHeroHeadline: 'Earn your Indiana Cosmetology License while getting paid.',
    belowHeroSubheadline: 'DOL Registered Apprenticeship. 2,000 hours of supervised salon training under a licensed cosmetologist. Earn wages from day one.',
    primaryCta: { label: 'Apply Now', href: '/programs/cosmetology-apprenticeship/apply' },
    secondaryCta: { label: 'Find a Host Salon', href: '/contact?program=cosmetology-apprenticeship', variant: 'secondary' },
    trustIndicators: ['DOL Registered Apprenticeship', 'Earn wages from day one', 'Indiana Cosmetology License', 'Salon-based training'],
    transcript: 'Earn Indiana Cosmetology License through a DOL Registered Apprenticeship of 2,000 hours of supervised training in a licensed salon. Cosmetologists commonly earn $26,000 to $48,000 depending on clientele and setting. Wages begin on day one. The Indiana Cosmetology License is required to work in any Indiana salon.',
    analyticsName: 'cosmetology-apprenticeship',
  }),

  'nail-technician-apprenticeship': programBanner('nail-technician-apprenticeship', {
    pageKey: 'nail-technician-apprenticeship',
    videoSrcDesktop: '/videos/nail-tech.mp4',
    posterImage: '/hero-images/barber-beauty-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/nail-tech.mp3',
    microLabel: 'DOL Registered Apprenticeship',
    credentialLabel: 'Indiana Nail Technician License',
    durationLabel: '600 hours',
    salaryRangeLabel: '$24,000 to $42,000',
    belowHeroHeadline: 'Earn your Indiana Nail Technician License while getting paid.',
    belowHeroSubheadline: 'DOL Registered Apprenticeship. 600 hours of supervised training in a licensed salon. Manicure, pedicure, acrylics, and gel nails. Earn wages from day one.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=nail-technician-apprenticeship' },
    secondaryCta: { label: 'Find a Host Salon', href: '/contact?program=nail-technician-apprenticeship', variant: 'secondary' },
    trustIndicators: ['DOL Registered Apprenticeship', 'Earn wages from day one', 'Indiana Nail Technician License', '600 hours — fastest path'],
    transcript: 'Earn Indiana Nail Technician License through a DOL Registered Apprenticeship of 600 hours — the fastest path to an Indiana nail license. Training covers manicure, pedicure, acrylics, and gel nails in a licensed salon. Nail technicians commonly earn $24,000 to $42,000. Wages begin on day one.',
    analyticsName: 'nail-technician-apprenticeship',
  }),

  'culinary-apprenticeship': programBanner('culinary-apprenticeship', {
    pageKey: 'culinary-apprenticeship',
    videoSrcDesktop: '/videos/beauty-cosmetology.mp4',
    posterImage: '/hero-images/barber-beauty-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/barber.mp3',
    microLabel: 'DOL Registered Apprenticeship',
    credentialLabel: 'ServSafe Manager',
    durationLabel: '2,000 hours',
    salaryRangeLabel: '$28,000 to $45,000',
    belowHeroHeadline: 'Culinary Apprenticeship — earn while you train.',
    belowHeroSubheadline: 'DOL Registered Apprenticeship. Hands-on training in a professional kitchen. Earn ServSafe Manager certification and culinary credentials. Wages from day one.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=culinary-apprenticeship' },
    secondaryCta: { label: 'Find a Host Kitchen', href: '/contact?program=culinary-apprenticeship', variant: 'secondary' },
    trustIndicators: ['DOL Registered Apprenticeship', 'Earn wages from day one', 'ServSafe Manager cert', 'Professional kitchen training'],
    transcript: 'Earn ServSafe Manager certification through a DOL Registered Culinary Apprenticeship of 2,000 hours in a professional kitchen, building skills in food preparation, kitchen operations, and food safety. Culinary professionals commonly earn $28,000 to $45,000. Wages begin on day one.',
    analyticsName: 'culinary-apprenticeship',
  }),

  'esthetician': programBanner('esthetician', {
    pageKey: 'esthetician',
    videoSrcDesktop: '/videos/beauty-cosmetology.mp4',
    posterImage: '/hero-images/barber-beauty-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/cosmetology.mp3',
    microLabel: 'Esthetician Certificate',
    credentialLabel: 'Esthetician Certificate',
    durationLabel: '5 weeks',
    salaryRangeLabel: '$32,000 to $48,000',
    belowHeroHeadline: 'Esthetician Certificate — skin care career in 5 weeks.',
    belowHeroSubheadline: 'Skin analysis, facial treatments, chemical peels, hair removal, and business startup. ETPL approved. Free with WIOA or Workforce Ready Grant.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=esthetician' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + WRG', 'ETPL approved', 'Business startup module', 'Esthetician pay $32K–$48K'],
    transcript: 'Earn an Esthetician Certificate in 5 weeks, building skills in skin analysis, facial treatments, chemical peels, hair removal, and business startup. Estheticians commonly earn $32,000 to $48,000. ETPL approved. Free with WIOA or Workforce Ready Grant for eligible Indiana residents.',
    analyticsName: 'esthetician',
  }),

  'beauty-career-educator': programBanner('beauty-career-educator', {
    pageKey: 'beauty-career-educator',
    videoSrcDesktop: '/videos/beauty-cosmetology.mp4',
    posterImage: '/hero-images/barber-beauty-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/cosmetology.mp3',
    microLabel: 'Certiport ESB',
    credentialLabel: 'Certiport ESB',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$28,000 to $45,000',
    belowHeroHeadline: 'Beauty & Career Educator — salon skills + workforce credentials in 12 weeks.',
    belowHeroSubheadline: 'Salon services, peer teaching, Certiport ESB, and Rise Up certification. Hybrid schedule. Free with WIOA or Workforce Ready Grant.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=beauty-career-educator' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + WRG', 'Certiport ESB certification', 'Rise Up credential', 'Hybrid schedule'],
    transcript: 'Earn Certiport ESB, Rise Up, and CPR credentials in 12 weeks alongside hands-on salon training and peer teaching skills. Beauty and career educator roles commonly earn $28,000 to $45,000. Hybrid schedule. Free with WIOA or Workforce Ready Grant for eligible Indiana residents.',
    analyticsName: 'beauty-career-educator',
  }),

  'apprenticeships': {
    pageKey: 'apprenticeships',
    videoSrcDesktop: '/videos/barber-hero-final.mp4',
    posterImage: '/hero-images/apprenticeships-hero.jpg',
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
    videoSrcDesktop: '/videos/it-technology.mp4',
    posterImage: '/hero-images/technology-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'CompTIA A+ Prep',
    credentialLabel: 'CompTIA A+',
    durationLabel: '8 weeks',
    salaryRangeLabel: '$38,000 to $52,000',
    belowHeroHeadline: 'IT Help Desk Technician — CompTIA A+ in 8 weeks.',
    belowHeroSubheadline: 'Troubleshoot hardware, software, and networks. Prepare for CompTIA A+ Core 1 and Core 2. A 4-Star Indiana Top Job. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=it-help-desk' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + Next Level Jobs', 'CompTIA A+ Core 1 + Core 2', '4-Star Indiana Top Job', 'IT support pay $38K–$52K'],
    transcript: 'Train for CompTIA A+ certification in 8 weeks, building skills in hardware troubleshooting, software support, and network fundamentals. IT help desk roles commonly earn $38,000 to $52,000. A 4-Star Indiana Top Job. Free with WIOA or Next Level Jobs funding for eligible Indiana residents.',
    analyticsName: 'it-help-desk',
  }),

  'cybersecurity-analyst': programBanner('cybersecurity-analyst', {
    pageKey: 'cybersecurity-analyst',
    videoSrcDesktop: '/videos/it-technology.mp4',
    posterImage: '/hero-images/technology-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'CompTIA Security+ Prep',
    credentialLabel: 'CompTIA Security+',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$55,000 to $85,000',
    belowHeroHeadline: 'Cybersecurity Analyst — CompTIA Security+ in 12 weeks.',
    belowHeroSubheadline: 'Network defense, threat analysis, and incident response. Prepare for CompTIA Security+ SY0-701. A 5-Star Indiana Top Job. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=cybersecurity-analyst' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + Next Level Jobs', 'CompTIA Security+ SY0-701', '5-Star Indiana Top Job', 'Cybersecurity pay $55K–$85K'],
    transcript: 'Train for CompTIA Security+ certification in 12 weeks, building skills in network defense, threat analysis, and incident response. Cybersecurity analysts commonly earn $55,000 to $85,000. A 5-Star Indiana Top Job. Free with WIOA or Next Level Jobs funding for eligible Indiana residents.',
    analyticsName: 'cybersecurity-analyst',
  }),

  'network-administration': programBanner('network-administration', {
    pageKey: 'network-administration',
    videoSrcDesktop: '/videos/it-technology.mp4',
    posterImage: '/hero-images/technology-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'CompTIA Network+ Prep',
    credentialLabel: 'CompTIA Network+',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$45,000 to $65,000',
    belowHeroHeadline: 'Network Administration — CompTIA Network+ in 10 weeks.',
    belowHeroSubheadline: 'Network design, TCP/IP, routing, switching, and troubleshooting. Prepare for CompTIA Network+ N10-009. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=network-administration' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + Next Level Jobs', 'CompTIA Network+ N10-009', 'Hands-on lab environment', 'Network admin pay $45K–$65K'],
    transcript: 'Train for CompTIA Network+ certification in 10 weeks, building skills in network design, TCP/IP, routing, switching, and troubleshooting. Network administrators commonly earn $45,000 to $65,000. Free with WIOA or Next Level Jobs funding for eligible Indiana residents.',
    analyticsName: 'network-administration',
  }),

  'network-support-technician': programBanner('network-support-technician', {
    pageKey: 'network-support-technician',
    videoSrcDesktop: '/videos/it-technology.mp4',
    posterImage: '/hero-images/technology-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'IT Specialist Networking',
    credentialLabel: 'Certiport IT Specialist Networking',
    durationLabel: '6 weeks',
    salaryRangeLabel: '$35,000 to $48,000',
    belowHeroHeadline: 'Network Support Technician — IT Specialist Networking in 6 weeks.',
    belowHeroSubheadline: 'Entry-level network support, cabling, and help desk skills. Prepare for the Certiport IT Specialist Networking exam. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=network-support-technician' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + Next Level Jobs', 'Certiport IT Specialist Networking', 'Entry-level pathway', 'Network support pay $35K–$48K'],
    transcript: 'Train for Certiport IT Specialist Networking certification in 6 weeks, building skills in network support, cabling, and help desk operations. Network support technicians commonly earn $35,000 to $48,000. Free with WIOA or Next Level Jobs funding for eligible Indiana residents.',
    analyticsName: 'network-support-technician',
  }),

  'software-development': programBanner('software-development', {
    pageKey: 'software-development',
    videoSrcDesktop: '/videos/it-technology.mp4',
    posterImage: '/hero-images/technology-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'IT Specialist Python',
    credentialLabel: 'Certiport IT Specialist Python',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$48,000 to $72,000',
    belowHeroHeadline: 'Software Development — IT Specialist Python in 12 weeks.',
    belowHeroSubheadline: 'Python programming, databases, APIs, and software engineering fundamentals. Prepare for Certiport IT Specialist Python and HTML certifications. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=software-development' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + Next Level Jobs', 'Certiport IT Specialist Python', 'Python + HTML certifications', 'Dev pay $48K–$72K'],
    transcript: 'Train for Certiport IT Specialist Python and HTML certifications in 12 weeks, building skills in Python programming, databases, APIs, and software engineering fundamentals. Entry-level developers commonly earn $48,000 to $72,000. Free with WIOA or Next Level Jobs funding for eligible Indiana residents.',
    analyticsName: 'software-development',
  }),

  'web-development': programBanner('web-development', {
    pageKey: 'web-development',
    videoSrcDesktop: '/videos/it-technology.mp4',
    posterImage: '/hero-images/technology-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'Meta Front-End Cert',
    credentialLabel: 'Meta Front-End Developer Professional Certificate',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$45,000 to $70,000',
    belowHeroHeadline: 'Web Development — Meta Front-End Developer + WordPress in 12 weeks.',
    belowHeroSubheadline: 'HTML, CSS, JavaScript, React, and WordPress. Prepare for Meta Front-End Developer Professional Certificate and WordPress Certified Developer. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=web-development' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + Next Level Jobs', 'Meta Front-End Developer cert', 'WordPress Certified Developer', 'Web dev pay $45K–$70K'],
    transcript: 'Train for Meta Front-End Developer Professional Certificate and WordPress Certified Developer credentials in 12 weeks, building skills in HTML, CSS, JavaScript, React, and WordPress. Web developers commonly earn $45,000 to $70,000. Free with WIOA or Next Level Jobs funding for eligible Indiana residents.',
    analyticsName: 'web-development',
  }),

  'graphic-design': programBanner('graphic-design', {
    pageKey: 'graphic-design',
    videoSrcDesktop: '/videos/it-technology.mp4',
    posterImage: '/hero-images/technology-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'Adobe Certified Professional',
    credentialLabel: 'Adobe Certified Professional',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$38,000 to $58,000',
    belowHeroHeadline: 'Graphic Design — Adobe Certified Professional in 10 weeks.',
    belowHeroSubheadline: 'Adobe Photoshop, Illustrator, and InDesign. Prepare for Adobe Certified Professional in Visual Design. WIOA and Next Level Jobs funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=graphic-design' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA + Next Level Jobs eligible', 'Adobe Certified Professional', 'Photoshop + Illustrator + InDesign', 'Designer pay $38K–$58K'],
    transcript: 'Train for Adobe Certified Professional in Visual Design in 10 weeks, building skills in Photoshop, Illustrator, and InDesign. Graphic designers commonly earn $38,000 to $58,000. WIOA and Next Level Jobs funding available for eligible Indiana residents. Apply now.',
    analyticsName: 'graphic-design',
  }),

  'cad-drafting': programBanner('cad-drafting', {
    pageKey: 'cad-drafting',
    videoSrcDesktop: '/videos/it-technology.mp4',
    posterImage: '/hero-images/technology-cat-new.jpg',
    voiceoverSrc: '/audio/heroes/technology.mp3',
    microLabel: 'Autodesk Certified User',
    credentialLabel: 'Autodesk Certified User',
    durationLabel: '10 weeks',
    salaryRangeLabel: '$42,000 to $60,000',
    belowHeroHeadline: 'CAD/Drafting Technician — Autodesk Certified User in 10 weeks.',
    belowHeroSubheadline: 'AutoCAD and Revit for architectural and mechanical drafting. Prepare for Autodesk Certified User credentials. WIOA and Next Level Jobs funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=cad-drafting' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA + Next Level Jobs eligible', 'Autodesk Certified User', 'AutoCAD + Revit', 'Drafter pay $42K–$60K'],
    transcript: 'Train for Autodesk Certified User credentials in 10 weeks, building skills in AutoCAD and Revit for architectural and mechanical drafting. Drafting technicians commonly earn $42,000 to $60,000. WIOA and Next Level Jobs funding available for eligible Indiana residents.',
    analyticsName: 'cad-drafting',
  }),

  // ── Business & Finance ────────────────────────────────────────────────────

  'tax-preparation': programBanner('tax-preparation', {
    pageKey: 'tax-preparation',
    videoSrcDesktop: '/videos/tax-career-paths.mp4',
    posterImage: '/hero-images/tax-hero.jpg',
    voiceoverSrc: '/audio/heroes/tax.mp3',
    microLabel: 'IRS PTIN + AFSP',
    credentialLabel: 'IRS PTIN and AFSP',
    durationLabel: '8 weeks',
    salaryRangeLabel: '$35,000 to $55,000',
    belowHeroHeadline: 'Tax Preparation — IRS PTIN and AFSP credential in 8 weeks.',
    belowHeroSubheadline: 'Individual and small business tax preparation with real tax software. Earn your IRS PTIN and AFSP credential. Enrolled Agent exam prep included. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=tax-preparation' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + Next Level Jobs', 'IRS PTIN + AFSP credential', 'Enrolled Agent exam prep', 'Tax prep pay $35K–$55K'],
    transcript: 'Train for IRS PTIN and AFSP credentials in 8 weeks, building skills in individual and small business tax preparation using real tax software. Tax preparers commonly earn $35,000 to $55,000. Enrolled Agent exam preparation included. Free with WIOA or Next Level Jobs funding for eligible Indiana residents.',
    analyticsName: 'tax-preparation',
  }),

  'bookkeeping': programBanner('bookkeeping', {
    pageKey: 'bookkeeping',
    videoSrcDesktop: '/videos/business-finance.mp4',
    posterImage: '/hero-images/business-hero.jpg',
    voiceoverSrc: '/audio/heroes/business.mp3',
    microLabel: 'QuickBooks Certified User',
    credentialLabel: 'QuickBooks Certified User',
    durationLabel: '5 weeks',
    salaryRangeLabel: '$38,000 to $52,000',
    belowHeroHeadline: 'Bookkeeping & QuickBooks — QuickBooks Certified User in 5 weeks.',
    belowHeroSubheadline: 'Small business accounting, accounts payable, receivable, and payroll. Prepare for the QuickBooks Certified User exam. Flexible payment plans available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=bookkeeping' },
    secondaryCta: { label: 'Payment Plans', href: '/contact?program=bookkeeping', variant: 'secondary' },
    trustIndicators: ['QuickBooks Certified User cert', 'Small business accounting', 'Flexible payment plans', '5-week program'],
    transcript: 'Train for QuickBooks Certified User certification in 5 weeks, building skills in small business accounting, accounts payable, receivable, and payroll. Bookkeepers commonly earn $38,000 to $52,000. Flexible payment plans available.',
    analyticsName: 'bookkeeping',
  }),

  'office-administration': programBanner('office-administration', {
    pageKey: 'office-administration',
    videoSrcDesktop: '/videos/business-finance.mp4',
    posterImage: '/hero-images/business-hero.jpg',
    voiceoverSrc: '/audio/heroes/business.mp3',
    microLabel: 'Microsoft Office Specialist',
    credentialLabel: 'Microsoft Office Specialist',
    durationLabel: '6 weeks',
    salaryRangeLabel: '$32,000 to $48,000',
    belowHeroHeadline: 'Office Administration — Microsoft Office Specialist in 6 weeks.',
    belowHeroSubheadline: 'Word, Excel, PowerPoint, Outlook, and business communication. Prepare for Microsoft Office Specialist Word and Excel certifications. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=office-administration' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + Next Level Jobs', 'MOS Word certification', 'MOS Excel certification', 'Admin pay $32K–$48K'],
    transcript: 'Train for Microsoft Office Specialist Word and Excel certifications in 6 weeks, building skills in Word, Excel, PowerPoint, Outlook, and business communication. Office administrators commonly earn $32,000 to $48,000. Free with WIOA or Next Level Jobs funding for eligible Indiana residents.',
    analyticsName: 'office-administration',
  }),

  'entrepreneurship': programBanner('entrepreneurship', {
    pageKey: 'entrepreneurship',
    videoSrcDesktop: '/videos/business-finance.mp4',
    posterImage: '/hero-images/business-hero.jpg',
    voiceoverSrc: '/audio/heroes/business.mp3',
    microLabel: 'Certiport ESB Certification',
    credentialLabel: 'Certiport ESB',
    durationLabel: '6 weeks',
    salaryRangeLabel: '$32,000 to $55,000',
    belowHeroHeadline: 'Entrepreneurship & Small Business — Certiport ESB in 6 weeks.',
    belowHeroSubheadline: 'Business planning, marketing, financial management, and Certiport ESB certification. Evening program. Build a real business plan. Free with WIOA or grant funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=entrepreneurship' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + grant funding', 'Certiport ESB certification', 'Evening schedule', 'Real business plan deliverable'],
    transcript: 'Train for Certiport ESB certification in 6 weeks, building skills in business planning, marketing, and financial management. Small business owners and business support roles commonly earn $32,000 to $55,000. Evening schedule. Free with WIOA or grant funding for eligible Indiana residents.',
    analyticsName: 'entrepreneurship',
  }),

  'business-administration': programBanner('business-administration', {
    pageKey: 'business-administration',
    videoSrcDesktop: '/videos/business-finance.mp4',
    posterImage: '/hero-images/business-hero.jpg',
    voiceoverSrc: '/audio/heroes/business.mp3',
    microLabel: 'MOS + Certiport ESB',
    credentialLabel: 'Microsoft Office Specialist',
    durationLabel: '8 weeks',
    salaryRangeLabel: '$38,000 to $55,000',
    belowHeroHeadline: 'Business Administration — Microsoft Office Specialist + Certiport ESB in 8 weeks.',
    belowHeroSubheadline: 'Microsoft Office, QuickBooks, and business fundamentals. Prepare for Microsoft Office Specialist and Certiport ESB certifications. WIOA and Next Level Jobs funding available.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=business-administration' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA + Next Level Jobs eligible', 'Microsoft Office Specialist', 'Certiport ESB cert', 'Business admin pay $38K–$55K'],
    transcript: 'Train for Microsoft Office Specialist and Certiport ESB certifications in 8 weeks, building skills in Microsoft Office, QuickBooks, and business fundamentals. Business administrators commonly earn $38,000 to $55,000. WIOA and Next Level Jobs funding available for eligible Indiana residents.',
    analyticsName: 'business-administration',
  }),

  'project-management': programBanner('project-management', {
    pageKey: 'project-management',
    videoSrcDesktop: '/videos/business-finance.mp4',
    posterImage: '/hero-images/business-hero.jpg',
    voiceoverSrc: '/audio/heroes/business.mp3',
    microLabel: 'Certiport PM Certification',
    credentialLabel: 'Certiport Project Management',
    durationLabel: '6 weeks',
    salaryRangeLabel: '$52,000 to $75,000',
    belowHeroHeadline: 'Project Management — Certiport PM certification in 6 weeks.',
    belowHeroSubheadline: 'Agile, Scrum, and traditional project management methodologies. Prepare for Certiport Project Management certification. Free with WIOA or Next Level Jobs funding.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=project-management' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['Free with WIOA + Next Level Jobs', 'Certiport Project Management cert', 'Agile + Scrum methodology', 'PM pay $52K–$75K'],
    transcript: 'Train for Certiport Project Management certification in 6 weeks, building skills in Agile, Scrum, and traditional project management methodologies. Project managers commonly earn $52,000 to $75,000. Free with WIOA or Next Level Jobs funding for eligible Indiana residents.',
    analyticsName: 'project-management',
  }),

  'finance-bookkeeping-accounting': programBanner('finance-bookkeeping-accounting', {
    pageKey: 'finance-bookkeeping-accounting',
    videoSrcDesktop: '/videos/tax-career-paths.mp4',
    posterImage: '/hero-images/business-hero.jpg',
    voiceoverSrc: '/audio/heroes/business.mp3',
    microLabel: 'IRS PTIN + QuickBooks',
    credentialLabel: 'IRS PTIN',
    durationLabel: '12 weeks',
    salaryRangeLabel: '$42,000 to $62,000',
    belowHeroHeadline: 'Finance, Bookkeeping & Accounting — tiered credential pathway in 12 weeks.',
    belowHeroSubheadline: 'Tax preparation, bookkeeping, payroll, and accounting. Earn IRS PTIN, QuickBooks Certified User, and prepare for the Enrolled Agent exam. Funded for eligible participants.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=finance-bookkeeping-accounting' },
    secondaryCta: { label: 'Check Funding', href: '/start', variant: 'secondary' },
    trustIndicators: ['WIOA funding available', 'IRS PTIN credential', 'QuickBooks Certified User', 'Enrolled Agent exam prep'],
    transcript: 'Earn IRS PTIN, QuickBooks Certified User, and Enrolled Agent exam preparation through a tiered credential pathway completed in 12 weeks, covering tax preparation, bookkeeping, payroll, and accounting. Finance professionals commonly earn $42,000 to $62,000. WIOA funding available for eligible Indiana residents.',
    analyticsName: 'finance-bookkeeping-accounting',
  }),

  // ── Peer Recovery ─────────────────────────────────────────────────────────

  'peer-recovery-specialist': programBanner('peer-recovery-specialist', {
    pageKey: 'peer-recovery-specialist',
    videoSrcDesktop: '/videos/career-services-hero.mp4',
    posterImage: '/hero-images/dsp-hero.jpg',
    voiceoverSrc: '/audio/heroes/peer-recovery.mp3',
    microLabel: 'Indiana CPRS Credential',
    credentialLabel: 'Indiana CPRS',
    durationLabel: '8 weeks',
    salaryRangeLabel: '$32,000 to $45,000',
    belowHeroHeadline: 'Peer Recovery Specialist — Indiana CPRS credential in 8 weeks.',
    belowHeroSubheadline: 'Substance use recovery support, motivational interviewing, and crisis response. Earn the Indiana CPRS credential. WIOA, FSSA IMPACT, and JRI funding available for eligible Indiana residents.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=peer-recovery-specialist' },
    secondaryCta: { label: 'Check Funding', href: '/check-eligibility', variant: 'secondary' },
    trustIndicators: ['WIOA + FSSA IMPACT + JRI eligible', 'Indiana CPRS credential', 'Motivational interviewing', 'Recovery support pay $32K–$45K'],
    transcript: 'Train for Indiana CPRS certification in 8 weeks, building skills in substance use recovery support, motivational interviewing, and crisis response. Peer recovery specialists commonly earn $32,000 to $45,000. WIOA, FSSA IMPACT, and JRI funding available for eligible Indiana residents.',
    analyticsName: 'peer-recovery-specialist',
  }),

  'technology': {
    pageKey: 'technology',
    videoSrcDesktop: '/videos/it-technology.mp4',
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
    videoSrcDesktop: '/videos/business-finance.mp4',
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

/**
 * Typed lookup — throws at runtime if pageKey is not registered.
 */
export function getHeroBanner(pageKey: keyof typeof heroBanners): HeroBannerConfig {
  const config = heroBanners[pageKey];
  if (!config) throw new Error(`No hero banner config found for pageKey: "${pageKey}"`);
  return config;
}

/**
 * internalProgramHeroBanners — the validated subset.
 *
 * ONLY internal workforce program pages use programBanner().
 * Category/sector pages (skilled-trades, technology, business, apprenticeships, etc.)
 * use plain HeroBannerConfig and are NOT included here.
 * CDL waitlist stub is intentionally excluded — no hero required.
 *
 * Import this when you need the typed, validated set (e.g. audit scripts, tests).
 */
export const internalProgramHeroBanners: Record<string, ProgramHeroBannerConfig> = Object.fromEntries(
  Object.entries(heroBanners).filter(([, v]) => 'credentialLabel' in v)
) as Record<string, ProgramHeroBannerConfig>;
