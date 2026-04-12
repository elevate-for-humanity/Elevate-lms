import { allPrograms } from "./programs";

export type FundingKey =
  | "jri"
  | "wrg"
  | "impact"
  | "wex"
  | "ojt"
  | "apprenticeship"
  | "tuition"
  | "employer";

export interface FundingSource {
  key: FundingKey;
  label: string;
  shortLabel: string;
  description: string;
  idealFor: string[];
  notes?: string;
}

export const fundingSources: FundingSource[] = [
  {
    key: "jri",
    label: "Job Ready Indy (JRI) – Stipend-Based Readiness",
    shortLabel: "JRI",
    description:
      "JRI is a local career readiness program that helps young adults build employability skills. When connected to Elevate, JRI can layer in stipends or incentives for attendance and completion where available.",
    idealFor: [
      "Youth and young adults building soft skills.",
      "On-ramp pathways into any Elevate program.",
      "Earn-while-you-learn readiness experiences."
    ],
    notes:
      "Eligibility, stipend amounts, and available cohorts are determined by the local board and implementing partners."
  },
  {
    key: "wrg",
    label: "Workforce Ready Grant (WRG) / State Training Funds",
    shortLabel: "WRG / State",
    description:
      "State training funds (like Workforce Ready Grant) can help cover tuition for approved high-demand programs. Elevate uses these funds where programs and learners are eligible, based on state policy.",
    idealFor: [
      "High-demand, short-term training in priority industries.",
      "Adults needing a no- or low-cost path into careers.",
      "Stackable credentials that lead to better jobs."
    ],
    notes:
      "Exact coverage depends on current state-approved lists and eligibility; not all programs are state funded."
  },
  {
    key: "impact",
    label: "FSSA IMPACT (Indiana Manpower Placement and Comprehensive Training)",
    shortLabel: "FSSA IMPACT",
    description:
      "IMPACT is a no-cost employment and training program administered by the Indiana Family and Social Services Administration (FSSA) / Division of Family Resources. IMPACT pays for training courses for current SNAP or TANF recipients. A case manager determines eligibility and stays in contact throughout training.",
    idealFor: [
      "Current SNAP (food assistance) recipients.",
      "Current TANF (cash assistance) recipients.",
      "Adults seeking short-term training that leads directly to employment.",
    ],
    notes:
      "Must be enrolled in SNAP or TANF first. Contact FSSA at 800-403-0864 (press 3) or ask your DFR eligibility worker for a referral. A high school diploma or GED is preferred for job skills training but not always required.",
  },
  {
    key: "wex",
    label: "Work Experience (WEX)",
    shortLabel: "WEX",
    description:
      "Work Experience (WEX) placements allow learners to earn wages while gaining real work experience with employers. WEX is usually time-limited and focuses on building basic work habits and exposure.",
    idealFor: [
      "First jobs and career exposure.",
      "Learners who need a supportive workplace to build confidence.",
      "Bridging from classroom to real work."
    ],
    notes:
      "WEX approvals and wage levels are set by the workforce board and are tied to specific worksites and roles."
  },
  {
    key: "ojt",
    label: "On-the-Job Training (OJT)",
    shortLabel: "OJT",
    description:
      "On-the-Job Training reimburses part of a new hire's wages to employers while the person is being trained. Elevate uses OJT to help employers say yes to learners ready for long-term roles.",
    idealFor: [
      "Employers hiring for permanent roles.",
      "Learners who are job-ready but need structured training time.",
      "Upskilling into higher-wage positions."
    ],
    notes:
      "OJT agreements are approved by the workforce board and require employer participation and documentation."
  },
  {
    key: "apprenticeship",
    label: "Apprenticeship / Earn While You Learn",
    shortLabel: "Apprenticeship",
    description:
      "Apprenticeship-style models combine related classroom instruction with paid, supervised work experience. Learners earn wages while building hours and competencies tied to occupation requirements.",
    idealFor: [
      "Hands-on careers like barbering, nails, esthetics, culinary, and building maintenance.",
      "Employers wanting stable talent and progression.",
      "Learners who want to earn and learn at the same time."
    ],
    notes:
      "Registration, wage progression, and standards depend on state and partner employers; Elevate aligns programs to those expectations."
  },
  {
    key: "tuition",
    label: "Tuition / Self-Pay & Payment Plans",
    shortLabel: "Tuition",
    description:
      "Some programs are tuition-based and can be paid out-of-pocket, through payment plans, employer tuition assistance, or philanthropy. Elevate uses Stripe to support secure pay-in-full or installment options.",
    idealFor: [
      "Learners ready to invest directly in training.",
      "Short pathways with clear return on investment.",
      "Programs not covered by state training funds."
    ],
    notes:
      "Exact payment options and schedules are set at the program level and can be combined with other supports where allowed."
  },
  {
    key: "employer",
    label: "Employer-Sponsored & Philanthropic Support",
    shortLabel: "Employer / Philanthropy",
    description:
      "In some cases, employers, community partners, or philanthropic funds can sponsor seats, cover tuition, or provide stipends to help remove barriers for learners.",
    idealFor: [
      "Upskilling current employees.",
      "Special cohorts for neighborhoods, justice-involved, or targeted populations.",
      "Pilot programs aligned with new funding guidance."
    ],
    notes:
      "Employer and philanthropic arrangements are customized and may be combined with WEX/OJT/apprenticeship when allowed."
  }
];

export type ProgramFundingMap = Record<string, FundingKey[]>;

/**
 * Map each program ID to the funding mechanisms it can align with.
 * This is a planning/intent map; actual eligibility depends on board approvals and partner agreements.
 */
export const programFundingMap: ProgramFundingMap = {
  // Healthcare — IMPACT covers CNA, Medical Assistant, Pharmacy Tech (listed on FSSA site)
  "prog-cna": ["impact", "tuition", "wex", "employer"],

  // Barber / Beauty — IMPACT does not cover barber (not short-term; employer-pay model)
  "prog-barber": ["apprenticeship", "wex", "ojt", "tuition", "employer"],
  "prog-nail-technician-apprenticeship": [
    "apprenticeship",
    "wex",
    "ojt",
    "tuition",
    "employer"
  ],
  "prog-esthetician-apprenticeship": [
    "apprenticeship",
    "wex",
    "ojt",
    "tuition",
    "employer"
  ],

  // Tax & Business
  "prog-tax-vita": ["impact", "jri", "wex", "tuition", "employer"],
  "prog-business-ems-apprenticeship": [
    "wex",
    "ojt",
    "apprenticeship",
    "employer"
  ],
  "prog-business-technician-apprenticeship": [
    "impact",
    "wex",
    "ojt",
    "apprenticeship",
    "tuition",
    "employer"
  ],

  // Trades & Facilities — IMPACT covers CDL, Welding, Culinary (listed on FSSA site)
  "prog-culinary-apprenticeship": [
    "impact",
    "apprenticeship",
    "wex",
    "ojt",
    "employer",
    "tuition"
  ],
  "prog-hvac": ["impact", "wex", "ojt", "tuition", "employer"],
  "prog-building-maintenance": [
    "impact",
    "apprenticeship",
    "wex",
    "ojt",
    "employer"
  ],

  // Transportation — IMPACT explicitly lists CDL
  "prog-cdl": ["impact", "wex", "ojt", "employer", "tuition"],

  // Tech & Customer Service — IMPACT lists Computer Support Specialist
  "prog-it-support": ["impact", "wex", "ojt", "tuition", "employer"],
  "prog-customer-service": [
    "impact",
    "jri",
    "wex",
    "ojt",
    "tuition",
    "employer"
  ],

  // Entrepreneurship — IMPACT focuses on employment, not self-employment; excluded
  "prog-entrepreneurship": ["tuition", "employer"]
};

/** Helper to get a friendly list of funding sources for a given program id. */
export function getFundingForProgram(programId: string): FundingSource[] {
  const keys = programFundingMap[programId] || [];
  return fundingSources.filter((fs) => keys.includes(fs.key));
}

/** Helper to get all programs grouped under each funding source. */
export function getProgramsByFundingKey() {
  const result: Record<FundingKey, typeof allPrograms> = {
    jri: [],
    wrg: [],
    impact: [],
    wex: [],
    ojt: [],
    apprenticeship: [],
    tuition: [],
    employer: []
  };

  for (const program of allPrograms) {
    const keys = programFundingMap[program.id] || [];
    for (const key of keys) {
      result[key] = [...result[key], program];
    }
  }

  return result;
}
