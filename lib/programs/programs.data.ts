export type ProgramFunding = {
  wioa?: boolean;
  wrg?: boolean;
  jri?: boolean;
  apprenticeship?: boolean;
  employerSponsored?: boolean;
  scholarships?: boolean;
};

export type ProgramFAQ = { q: string; a: string };

export type ProgramStory = {
  whoThisHelps: string;
  theProblem: string;
  theTransformation: string;
  whatToExpect: string;
};

export type ProgramVideoHighlight = {
  id: string;
  title: string;
  description?: string;
  videoSrc?: string;
  poster?: string;
};

export type Program = {
  slug: string;
  title: string;
  tagline: string;
  shortDescription: string;

  heroImage?: string;
  cardImage?: string;
  videoUrl?: string;

  duration?: string;
  cost?: string;
  format?: string;
  level?: string;

  story?: ProgramStory;
  videoHighlights?: ProgramVideoHighlight[];
  highlights: string[];
  whatYoullLearn: string[];
  whoItsFor: string[];
  stepsToStart: string[];

  funding: ProgramFunding;

  outcomes?: string[];
  requirements?: string[];
  faq?: ProgramFAQ[];

  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

export const PROGRAMS: Program[] = [
  {
    slug: "barber-apprenticeship",
    title: "Barber Apprenticeship",
    tagline: "Earn while you learn in a real shop.",
    shortDescription:
      "Indiana registered apprenticeship pathway to licensure with hands-on training and mentorship.",
    cardImage: "/images/pages/barber-apprenticeship.jpg",
    heroImage: "/images/pages/barber-hero-main.jpg",
    cardImage: "/images/pages/barber-apprenticeship.jpg",
    duration: "Up to 5 months (timeline varies by hours transferred)",
    cost: "Funding may cover full cost",
    format: "Hybrid / In-person",
    level: "Entry",
    story: {
      whoThisHelps: "People who want a skilled trade career with clear licensing and real income potential.",
      theProblem: "Traditional barber school is expensive and doesn't always connect you to real shops or funding.",
      theTransformation: "You complete hours in a real shop, build a client base, and move toward licensure with support every step.",
      whatToExpect: "Structured milestones, hands-on training, and help navigating Indiana's licensing requirements.",
    },
    videoHighlights: [
      {
        id: "overview",
        title: "Program Overview",
        description: "What the barber apprenticeship looks like and how the pathway works.",
      },
      {
        id: "experience",
        title: "Hands-On Training Experience",
        description: "Real shop experience, hour tracking, and mentor support.",
      },
      {
        id: "outcomes",
        title: "Career Outcomes",
        description: "What happens after completion and how graduates move into work.",
      },
    ],
    highlights: [
      "Earn while you learn with a structured apprenticeship pathway",
      "Clear hour tracking, milestones, and completion support",
      "Funding pathways may cover costs based on eligibility",
      "Transfer hours review available (where applicable)",
    ],
    whatYoullLearn: [
      "Sanitation, safety, and client consultation",
      "Cutting, fading, shaving, and finishing",
      "Shop readiness, professionalism, and retention",
    ],
    whoItsFor: [
      "People starting a barber career",
      "Those transferring hours from another state",
      "Individuals seeking structured, supported training",
    ],
    stepsToStart: [
      "Submit a quick application",
      "Confirm eligibility and funding options",
      "Complete intake + program orientation",
      "Begin training and track hours",
      "Complete milestones and prepare for licensing requirements",
    ],
    funding: { apprenticeship: true, wioa: true, wrg: true, jri: true },
    outcomes: ["Licensed barber track", "Barbershop employment", "Independent business pathway"],
    requirements: ["Valid ID", "Intake/eligibility verification (if funding applies)"],
    primaryCtaLabel: "Start Inquiry",
    primaryCtaHref: "/apply?program=barber-apprenticeship",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=barber-apprenticeship",
    faq: [
      { q: "Can I transfer hours from another state?", a: "Yes. We can review documentation and map hours where allowed." },
      { q: "Will funding cover tuition?", a: "Funding is eligibility-based. We'll help you determine options and next steps." },
    ],
  },
  {
    slug: "beauty-career-educator",
    title: "Beauty and Career Educator Training",
    tagline: "Salon services + teaching + entrepreneurship.",
    shortDescription:
      "Hybrid training with practical workshops and workforce readiness for beauty professionals.",
    cardImage: "/images/pages/cosmetology.jpg",
    heroImage: "/images/pages/cosmetology.jpg",
    duration: "12-16 weeks",
    cost: "Funding may cover full cost",
    format: "Hybrid",
    level: "Entry to Intermediate",
    highlights: [
      "Build salon skills plus the pathway to teach and lead",
      "Hybrid learning with practical workshops and coaching",
      "Career-ready tools: professionalism, client service, business basics",
      "Support selecting the right track based on your goals",
    ],
    whatYoullLearn: [
      "Advanced beauty techniques",
      "Instructional methods",
      "Business planning and marketing",
    ],
    whoItsFor: [
      "Beauty professionals seeking to teach",
      "Salon owners",
      "Career changers interested in beauty education",
    ],
    stepsToStart: [
      "Submit application",
      "Complete intake assessment",
      "Begin hybrid coursework",
      "Complete practical workshops",
      "Receive certification",
    ],
    funding: { wioa: true, wrg: true, jri: true },
    outcomes: ["Beauty educator certification", "Salon employment", "Independent business"],
    primaryCtaLabel: "Start Inquiry",
    primaryCtaHref: "/apply?program=beauty-career-educator",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=beauty-career-educator",
  },
  {
    slug: "professional-esthetician",
    title: "Esthetics and Skincare Specialist Certificate",
    tagline: "Skincare training with hands-on practice.",
    shortDescription:
      "Hybrid theory + practical training for spa/salon/mobile services with certification pathway.",
    cardImage: "/images/pages/nail-technician.jpg",
    heroImage: "/images/pages/nail-technician.jpg",
    duration: "10-14 weeks",
    cost: "Funding may cover full cost",
    format: "Hybrid",
    level: "Entry",
    highlights: [
      "Skincare fundamentals with hands-on practice",
      "Client consultation, service flow, and safety standards",
      "Build confidence for spa, salon, or mobile services",
      "Clear milestones and support from intake to completion",
    ],
    whatYoullLearn: [
      "Facial treatments and skincare analysis",
      "Product knowledge and application",
      "Client consultation and service delivery",
    ],
    whoItsFor: [
      "Beauty career starters",
      "Spa/salon professionals",
      "Mobile service entrepreneurs",
    ],
    stepsToStart: [
      "Apply online",
      "Complete orientation",
      "Begin theory coursework",
      "Complete hands-on training",
      "Prepare for certification",
    ],
    funding: { wioa: true, wrg: true, jri: true },
    outcomes: ["Esthetician certification", "Spa/salon employment", "Mobile skincare business"],
    primaryCtaLabel: "Start Inquiry",
    primaryCtaHref: "/apply?program=professional-esthetician",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=professional-esthetician",
  },
  {
    slug: "business-startup-marketing",
    title: "Business Start-up & Marketing",
    tagline: "LLC formation + marketing + real support.",
    shortDescription:
      "Hands-on entrepreneurship training for launching your business with legal structure and marketing strategy.",
    cardImage: "/images/pages/business-sector.jpg",
    heroImage: "/images/pages/training-classroom.jpg",
    duration: "8-10 weeks",
    cost: "Funding may cover full cost",
    format: "Hybrid / Online",
    level: "Entry",
    highlights: [
      "Launch-ready steps: brand, offer, pricing, and marketing plan",
      "Practical support for systems, workflows, and client acquisition",
      "Designed for service businesses and local entrepreneurs",
      "Clear weekly action plan so you don't get stuck",
    ],
    whatYoullLearn: [
      "Business structure and legal basics",
      "Marketing and branding fundamentals",
      "Financial planning and budgeting",
    ],
    whoItsFor: [
      "Aspiring entrepreneurs",
      "Small business owners",
      "Career changers seeking independence",
    ],
    stepsToStart: [
      "Submit application",
      "Complete business assessment",
      "Develop business plan",
      "Complete coursework",
      "Launch business with support",
    ],
    funding: { wioa: true, wrg: true, jri: true },
    outcomes: ["Business launch", "Marketing skills", "Entrepreneurship pathway"],
    primaryCtaLabel: "Start Inquiry",
    primaryCtaHref: "/apply?program=business-startup-marketing",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=business-startup-marketing",
  },
  {
    slug: "tax-prep-financial-services",
    title: "Tax Preparation & Financial Services Certificate",
    tagline: "IRS-approved training + supervised practicum.",
    shortDescription:
      "Tax prep, QuickBooks, Microsoft 365, and financial literacy certifications for building a service business.",
    cardImage: "/images/pages/supersonic-tax-prep.jpg",
    heroImage: "/images/pages/supersonic-tax-prep.jpg",
    duration: "10 weeks",
    cost: "Funding may cover full cost",
    format: "Hybrid / Online",
    level: "Entry",
    videoHighlights: [
      {
        id: "overview",
        title: "Tax Business Pathway",
        description: "How to build a tax preparation service from training to clients.",
      },
      {
        id: "workflow",
        title: "Client Workflow",
        description: "Intake, documentation, filing, and professional service delivery.",
      },
    ],
    highlights: [
      "Learn the tax workflow: intake, documents, filing, and compliance basics",
      "Business-minded training so you can start earning (not just 'take a class')",
      "Client-ready processes, professionalism, and service packaging",
      "Clear next steps for certifications and business launch guidance",
    ],
    whatYoullLearn: [
      "Tax prep fundamentals and filing workflow",
      "QuickBooks for small business",
      "Microsoft 365 productivity tools",
      "Financial literacy and client management",
    ],
    whoItsFor: [
      "New tax preparers or career changers",
      "People who want a flexible business model",
      "Anyone building skills for finance/admin roles",
    ],
    stepsToStart: [
      "Apply online",
      "Choose funding or self-pay",
      "Complete onboarding and access coursework",
      "Practice scenarios and complete assessments",
      "Complete certificate + next steps for business launch",
    ],
    funding: { wioa: true, wrg: true, jri: true },
    outcomes: ["Tax preparation business", "Seasonal income stream", "Finance/admin career pathway"],
    primaryCtaLabel: "Start Inquiry",
    primaryCtaHref: "/apply?program=tax-prep-financial-services",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=tax-prep-financial-services",
  },
  {
    slug: "cna",
    title: "Certified Nursing Assistant (CNA)",
    tagline: "Fast-track training for entry-level healthcare roles.",
    shortDescription:
      "CNA pathway for long-term care, hospitals, and home health with structured support.",
    cardImage: "/images/pages/cna-patient-care.jpg",
    heroImage: "/images/pages/cna-clinical.jpg",
    duration: "Varies by cohort",
    cost: "Funding may cover full cost",
    format: "Hybrid / In-person",
    level: "Entry",
    videoHighlights: [
      {
        id: "overview",
        title: "Healthcare Pathway Overview",
        description: "What to expect in the CNA training experience.",
      },
      {
        id: "skills",
        title: "Skills You'll Practice",
        description: "Patient care, professionalism, and job readiness.",
      },
    ],
    highlights: [
      "Entry-level healthcare pathway with structured support",
      "Professional standards, safety, and confidence-building practice",
      "Clear milestones from onboarding to completion",
      "Designed to move you toward real employment outcomes",
    ],
    whatYoullLearn: ["Patient care basics", "Professional standards", "Job readiness in healthcare settings"],
    whoItsFor: ["New healthcare entrants", "Career changers", "People seeking stable career pathways"],
    stepsToStart: ["Apply", "Confirm schedule and eligibility", "Complete onboarding", "Start training", "Complete requirements"],
    funding: { wioa: true, wrg: true, jri: true },
    outcomes: ["CNA certification", "Healthcare employment", "Pathway to advanced healthcare roles"],
    primaryCtaLabel: "Start Inquiry",
    primaryCtaHref: "/apply?program=cna",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=cna",
  },
  {
    slug: "direct-support-professional",
    title: "Direct Support Professional (DSP) Training",
    tagline: "Build a meaningful career supporting individuals and families.",
    shortDescription:
      "Hands-on training, real-world scenarios, and job-ready skills for DSP roles in community care.",
    cardImage: "/images/pages/peer-recovery.jpg",
    heroImage: "/images/pages/peer-recovery.jpg",
    duration: "Varies by cohort",
    cost: "Funding may cover full cost",
    format: "Hybrid / In-person",
    level: "Entry",
    story: {
      whoThisHelps: "People who want stable work while making a real difference.",
      theProblem: "It's hard to find a career path that feels meaningful and actually pays—especially without support.",
      theTransformation: "You leave with practical skills, confidence, and a clear next step toward employment.",
      whatToExpect: "Clear milestones, hands-on training, and support from application to completion.",
    },
    videoHighlights: [
      {
        id: "overview",
        title: "What DSP Work Looks Like",
        description: "Daily responsibilities, client interaction, and the impact you make.",
      },
      {
        id: "training",
        title: "Training & Support",
        description: "How we prepare you with skills, confidence, and job readiness.",
      },
    ],
    highlights: [
      "Meaningful work pathway supporting individuals and families",
      "Communication, documentation, and daily support skills",
      "Job-ready expectations: reliability, professionalism, safety",
      "Structured milestones and completion support",
    ],
    whatYoullLearn: [
      "Care basics, safety, and ethical standards",
      "Communication, documentation, and daily support skills",
      "Workplace readiness and reliability",
    ],
    whoItsFor: [
      "New healthcare and support-care entrants",
      "Career changers seeking stable work",
      "People who want meaningful, service-based careers",
    ],
    stepsToStart: [
      "Apply",
      "Confirm eligibility/funding",
      "Complete onboarding",
      "Start training",
      "Complete milestones and secure employment",
    ],
    funding: { wioa: true, wrg: true, jri: true },
    outcomes: ["DSP certification", "Community care employment", "Pathway to healthcare advancement"],
    primaryCtaLabel: "Start Inquiry",
    primaryCtaHref: "/apply?program=direct-support-professional",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=direct-support-professional",
  },
  {
    slug: "emergency-health-safety-tech",
    title: "Emergency Health & Safety Technician",
    tagline: "CPR/AED, First Aid, EMR, and OSHA 10 pathway.",
    shortDescription:
      "Hybrid theory + hands-on skills training for public safety careers and emergency response.",
    cardImage: "/images/pages/cpr-training-real.jpg",
    heroImage: "/images/pages/cpr-aed.jpg",
    duration: "6-8 weeks",
    cost: "Funding may cover full cost",
    format: "Hybrid",
    level: "Entry",
    highlights: [
      "Safety-first training designed for public-facing roles",
      "Hands-on skills with clear performance milestones",
      "Strong fit for people entering healthcare, security, or workplace safety",
      "Credentials stack well with other pathways",
    ],
    whatYoullLearn: [
      "CPR, AED, and First Aid techniques",
      "Emergency medical response basics",
      "OSHA workplace safety standards",
    ],
    whoItsFor: [
      "Public safety career starters",
      "Healthcare support roles",
      "Workplace safety professionals",
    ],
    stepsToStart: [
      "Submit application",
      "Complete orientation",
      "Begin hybrid coursework",
      "Complete hands-on training",
      "Receive certifications",
    ],
    funding: { wioa: true, wrg: true, jri: true },
    outcomes: ["Multiple safety certifications", "Emergency response employment", "Healthcare support roles"],
    primaryCtaLabel: "Start Inquiry",
    primaryCtaHref: "/apply?program=emergency-health-safety-tech",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=emergency-health-safety-tech",
  },
  {
    slug: "home-health-aide",
    title: "Home Health Aide Certification",
    tagline: "In-home care training with certification support.",
    shortDescription:
      "Hybrid coursework + in-person clinical training for home health aide roles.",
    cardImage: "/images/pages/cna-nursing.jpg",
    heroImage: "/images/pages/cna-nursing-real.jpg",
    duration: "8-10 weeks",
    cost: "Funding may cover full cost",
    format: "Hybrid",
    level: "Entry",
    highlights: [
      "In-home care pathway with practical, real-world preparation",
      "Client communication, safety, and professional boundaries",
      "Structured learning with support and accountability",
      "Great entry point into healthcare and caregiving careers",
    ],
    whatYoullLearn: [
      "Personal care and daily living assistance",
      "Vital signs and basic health monitoring",
      "Communication with patients and families",
    ],
    whoItsFor: [
      "Compassionate caregivers",
      "Healthcare career starters",
      "Those seeking flexible healthcare work",
    ],
    stepsToStart: [
      "Apply online",
      "Complete background check",
      "Begin hybrid coursework",
      "Complete clinical training",
      "Receive certification",
    ],
    funding: { wioa: true, wrg: true, jri: true },
    outcomes: ["Home health aide certification", "In-home care employment", "Healthcare career pathway"],
    primaryCtaLabel: "Start Inquiry",
    primaryCtaHref: "/apply?program=home-health-aide",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=home-health-aide",
  },
  {
    slug: "workforce-readiness",
    title: "Workforce Readiness (Youth & Adult)",
    tagline: "Job readiness skills for work and training success.",
    shortDescription:
      "Communication, resume/interview prep, and workplace expectations for youth and adults.",
    cardImage: "/images/pages/training-page-2.jpg",
    heroImage: "/images/pages/training-page-3.jpg",
    duration: "4-8 weeks",
    cost: "Free",
    format: "Hybrid / Online",
    level: "Entry",
    highlights: [
      "Resume, interview, communication, and workplace expectations",
      "Built for youth and adults entering training or employment",
      "Confidence + consistency coaching (show up, follow through, level up)",
      "Fast wins that improve hiring outcomes quickly",
    ],
    whatYoullLearn: [
      "Professional communication",
      "Time management and organization",
      "Resume writing and interview skills",
      "Workplace expectations",
    ],
    whoItsFor: [
      "Youth entering the workforce",
      "Adults re-entering employment",
      "Career changers",
    ],
    stepsToStart: [
      "Apply online",
      "Complete orientation",
      "Engage with coursework",
      "Complete assessments",
      "Receive certificate and job search support",
    ],
    funding: { wioa: true, wrg: true, jri: true },
    outcomes: ["Workforce readiness certificate", "Job search skills", "Career pathway clarity"],
    primaryCtaLabel: "Start Workforce Readiness",
    primaryCtaHref: "/apply?program=workforce-readiness",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=workforce-readiness",
  },
  {
    slug: "peer-recovery-coach",
    title: "Public Safety Reentry Specialist",
    tagline: "Support-focused training for justice-involved and career changers.",
    shortDescription:
      "Pathway aligned to peer recovery and reentry support roles with trauma-informed care training.",
    cardImage: "/images/pages/training-cohort.jpg",
    heroImage: "/images/pages/training-page-1.jpg",
    duration: "10-12 weeks",
    cost: "Funding may cover full cost",
    format: "Hybrid",
    level: "Entry",
    story: {
      whoThisHelps: "People with lived experience who want to help others navigate reentry and recovery.",
      theProblem: "Traditional career paths often don't value lived experience or provide clear pathways to meaningful work.",
      theTransformation: "You gain credentials, confidence, and a career helping others while building your own stability.",
      whatToExpect: "Trauma-informed training, peer support, and connections to reentry and recovery organizations.",
    },
    highlights: [
      "Support-focused training for community impact roles",
      "Communication, boundaries, documentation, and professionalism",
      "Designed for people who want purpose-driven work",
      "Clear milestones and support navigating next steps",
    ],
    whatYoullLearn: [
      "Peer recovery coaching fundamentals",
      "Trauma-informed care approaches",
      "Case management and documentation",
    ],
    whoItsFor: [
      "Justice-involved individuals",
      "People in recovery",
      "Career changers seeking meaningful work",
    ],
    stepsToStart: [
      "Apply",
      "Complete intake assessment",
      "Begin training",
      "Complete practicum",
      "Receive certification and job placement support",
    ],
    funding: { wioa: true, wrg: true, jri: true },
    outcomes: ["Peer recovery coach certification", "Reentry support employment", "Community impact career"],
    primaryCtaLabel: "Start Inquiry",
    primaryCtaHref: "/apply?program=peer-recovery-coach",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=peer-recovery-coach",
  },
  {
    slug: "cpr-certification",
    title: "CPR, AED & First Aid Certification",
    tagline: "Essential lifesaving skills (AHA card valid 2 years).",
    shortDescription:
      "In-person hands-on training for CPR/AED/First Aid with American Heart Association certification.",
    cardImage: "/images/pages/cpr-mannequin.jpg",
    heroImage: "/images/pages/cpr-first-aid.jpg",
    duration: "1 day",
    cost: "Low cost / Funding available",
    format: "In-person",
    level: "Entry",
    highlights: [
      "Essential lifesaving skills for work and family",
      "Hands-on practice (not just slides)",
      "Great for childcare, healthcare, security, and service roles",
      "Fast completion with clear certification outcome",
    ],
    whatYoullLearn: [
      "CPR techniques for adults, children, and infants",
      "AED operation",
      "First aid for common emergencies",
    ],
    whoItsFor: [
      "Healthcare workers",
      "Childcare providers",
      "Anyone needing certification",
    ],
    stepsToStart: [
      "Register for class",
      "Attend in-person training",
      "Complete hands-on assessments",
      "Receive AHA certification card",
    ],
    funding: { wioa: true, wrg: true, jri: true },
    outcomes: ["AHA CPR/AED/First Aid certification", "Workplace requirement fulfillment", "Lifesaving skills"],
    primaryCtaLabel: "Start Inquiry",
    primaryCtaHref: "/apply?program=cpr-certification",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=cpr-certification",
  },
  {
    slug: "hvac-technician",
    title: "HVAC Technician",
    tagline: "Hands-on HVAC training for real residential/light commercial work.",
    shortDescription:
      "Hybrid program for heating, cooling, and refrigeration basics with industry-recognized training.",
    cardImage: "/images/pages/hvac-technician.jpg",
    heroImage: "/images/pages/hvac-unit.jpg",
    duration: "12-16 weeks",
    cost: "Funding may cover full cost",
    format: "In-person",
    level: "Entry to Intermediate",
    highlights: [
      "Hands-on pathway for in-demand skilled trades work",
      "Practical troubleshooting mindset + jobsite professionalism",
      "Strong fit for people who want stable income and growth",
      "Structured milestones that keep you moving forward",
    ],
    whatYoullLearn: [
      "HVAC system fundamentals",
      "Installation and maintenance procedures",
      "Troubleshooting and repair techniques",
      "Safety and compliance standards",
    ],
    whoItsFor: [
      "Career changers seeking skilled trades",
      "Entry-level technicians",
      "Those seeking stable, in-demand careers",
    ],
    stepsToStart: [
      "Submit application",
      "Complete intake assessment",
      "Confirm funding eligibility",
      "Begin hands-on training",
      "Complete certification requirements",
    ],
    funding: { wioa: true, wrg: true, apprenticeship: true },
    outcomes: ["HVAC technician certification", "Employment with HVAC companies", "Independent contractor pathway"],
    primaryCtaLabel: "Start Inquiry",
    primaryCtaHref: "/apply?program=hvac-technician",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=hvac-technician",
  },
  {
    slug: "cdl",
    title: "Commercial Driver's License (CDL)",
    tagline: "Training for Class A or Class B licensing.",
    shortDescription:
      "Classroom + yard practice + road training (varies by partner) for CDL preparation.",
    cardImage: "/images/pages/cdl-truck-highway.jpg",
    heroImage: "/images/pages/cdl-training.jpg",
    duration: "4-6 weeks",
    cost: "Funding may cover full cost",
    format: "In-person",
    level: "Entry",
    highlights: [
      "Clear pathway to Class A/Class B preparation (based on partner track)",
      "Built for people who want a direct route to employment",
      "Support understanding timelines, requirements, and next steps",
      "Strong career mobility and earning potential",
    ],
    whatYoullLearn: [
      "Vehicle operation and safety",
      "Pre-trip inspections",
      "Backing and maneuvering",
      "Road test preparation",
    ],
    whoItsFor: [
      "Career changers",
      "Those seeking stable employment",
      "People interested in transportation careers",
    ],
    stepsToStart: [
      "Apply and confirm eligibility",
      "Complete medical requirements",
      "Begin classroom and behind-the-wheel training",
      "Practice for CDL exam",
      "Take CDL test and secure employment",
    ],
    funding: { wioa: true, wrg: true, jri: true },
    outcomes: ["CDL license", "Truck driving employment", "Transportation career pathway"],
    primaryCtaLabel: "Start Inquiry",
    primaryCtaHref: "/apply?program=cdl",
    secondaryCtaLabel: "Talk to an Advisor",
    secondaryCtaHref: "/contact?topic=cdl",
  },
];

export function getProgramBySlug(slug: string) {
  return PROGRAMS.find((p) => p.slug === slug) ?? null;
}
