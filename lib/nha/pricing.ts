/**
 * NHA (National Healthcareer Association) product pricing for Elevate for Humanity.
 * Account number: 412957
 *
 * Source: NHA proposals received April 2026.
 * All prices are per-learner. Discounted prices reflect the negotiated rate.
 * Products are non-refundable and non-transferable per NHA policy.
 */

export interface NhaProduct {
  /** NHA product name */
  name: string;
  /** Short description */
  description: string;
  /** List price per learner in dollars */
  listPrice: number;
}

export interface NhaProposal {
  /** Program this proposal covers */
  program: string;
  /** Credential earned */
  credential: string;
  /** NHA exam credential code */
  credentialCode: string;
  /** Individual products included */
  products: NhaProduct[];
  /** Sum of all product list prices */
  totalListPrice: number;
  /** Discount amount negotiated */
  discountAmount: number;
  /** Final per-learner cost after discount */
  totalDiscountedPrice: number;
}

// ── Medical Assistant (CCMA) ──────────────────────────────────────────────────

export const NHA_MEDICAL_ASSISTANT: NhaProposal = {
  program: 'Medical Assistant',
  credential: 'Certified Clinical Medical Assistant',
  credentialCode: 'CCMA',
  products: [
    {
      name: 'CCMA Exam Prep — Online Study Guide',
      description:
        '13 modules of instructional content, videos, case studies, practice activities, end-of-module quizzes aligned with the CCMA Certification Exam.',
      listPrice: 94,
    },
    {
      name: 'CCMA Exam Prep — Online Practice Test',
      description:
        '6 attempts at online CCMA practice assessment with Focused Review® reports and predictive analytics.',
      listPrice: 0, // bundled in the $94 study guide line item
    },
    {
      name: 'CCMA Certification Exam',
      description: 'Online CCMA certification exam with test plan and results reporting.',
      listPrice: 165,
    },
    {
      name: 'Core Learning — Medical Terminology',
      description: '25 modules with end-of-module quizzes, implementation guides, and facilitator tool kit.',
      listPrice: 75,
    },
    {
      name: 'Core Learning — Anatomy & Physiology',
      description: '16 modules with end-of-module quizzes, implementation guides, and facilitator tool kit.',
      listPrice: 75,
    },
    {
      name: 'MA SkillsBuilder™ — Clinical Plus',
      description:
        '25 modules covering 12 clinical skills + 13 foundational content modules. Learn, practice, and assess the top 39 clinical skills.',
      listPrice: 129,
    },
    {
      name: 'MA SkillsBuilder™ — Administrative Plus',
      description:
        '14 modules covering 7 administrative skills + 7 foundational content modules. Top 25 administrative skills.',
      listPrice: 129,
    },
    {
      name: 'PersonAbility™',
      description:
        'Professional skills for patient communication, education, and engagement. Includes practice & assessment simulations.',
      listPrice: 80,
    },
    {
      name: 'Principles of Health Coaching',
      description:
        '4 self-paced modules with virtual simulation, end-of-module quizzes, and practice & assessment simulations.',
      listPrice: 150,
    },
  ],
  totalListPrice: 897,
  discountAmount: 192.20,
  totalDiscountedPrice: 704.80,
};

// ── Pharmacy Technician (ExCPT) ───────────────────────────────────────────────

export const NHA_PHARMACY_TECHNICIAN: NhaProposal = {
  program: 'Pharmacy Technician',
  credential: 'Exam for the Certification of Pharmacy Technicians',
  credentialCode: 'ExCPT',
  products: [
    {
      name: 'ExCPT Exam Prep — Online Study Guide',
      description:
        '8 modules of instructional content, videos, case studies, practice activities, end-of-module quizzes aligned with the ExCPT Certification Exam.',
      listPrice: 89,
    },
    {
      name: 'ExCPT Exam Prep — Online Practice Test',
      description:
        '6 attempts at online ExCPT practice assessment with Focused Review® reports and predictive analytics.',
      listPrice: 0, // bundled in the $89 study guide line item
    },
    {
      name: 'ExCPT Certification Exam',
      description:
        'Online ExCPT certification exam with test plan and results reporting. Includes one free exam retake.',
      listPrice: 129,
    },
    {
      name: 'PharmaSeer™',
      description:
        '20 modules, 140 lessons, 1,400 scored assessment questions, and 700 in-lesson self-evaluation assessments covering all pharmacy settings.',
      listPrice: 289,
    },
    {
      name: 'PharmaSeer Math™',
      description:
        'Pharmacy calculations across all settings. End-of-lesson quizzes, 3 calculation methods per activity, animated demonstrations.',
      listPrice: 125,
    },
    {
      name: 'PersonAbility™',
      description:
        'Professional skills for patient communication, education, and engagement. Includes practice & assessment simulations.',
      listPrice: 80,
    },
  ],
  totalListPrice: 712,
  discountAmount: 157,
  totalDiscountedPrice: 555,
};

// ── Phlebotomy Technician (CPT) ───────────────────────────────────────────────
// Available à la carte — no bundled proposal discount.

export interface NhaAlaCarteProduct extends NhaProduct {
  /** SKU / product key */
  key: string;
}

export const NHA_PHLEBOTOMY_PRODUCTS: NhaAlaCarteProduct[] = [
  {
    key: 'cpt-study-guide',
    name: 'CPT Online Study Guide',
    description:
      'Online study guide with tutorials and end-of-module quizzes aligned with the CPT Certification Exam.',
    listPrice: 54,
  },
  {
    key: 'cpt-practice-test',
    name: 'CPT Online Practice Test',
    description:
      '6 attempts at online CPT practice assessment with 6 Focused Review® reports and predictive analytics and readiness reports for candidate and facilitator.',
    listPrice: 49,
  },
  {
    key: 'cpt-exam-prep-package',
    name: 'CPT Exam Prep Package',
    description:
      'Bundles CPT Online Study Guide + CPT Online Practice Test at a combined discount.',
    listPrice: 84,
  },
  {
    key: 'cpt-certification-exam',
    name: 'CPT Certification Exam',
    description:
      'Online CPT certification exam with test plan and exam results reporting.',
    listPrice: 129,
  },
];

/** Most cost-effective path: Exam Prep Package + Exam = $213 per learner. */
export const NHA_PHLEBOTOMY_RECOMMENDED_COST =
  NHA_PHLEBOTOMY_PRODUCTS.find(p => p.key === 'cpt-exam-prep-package')!.listPrice +
  NHA_PHLEBOTOMY_PRODUCTS.find(p => p.key === 'cpt-certification-exam')!.listPrice; // $213

// ── Medical Administrative Assistant (CMAA) ──────────────────────────────────

export const NHA_MEDICAL_ADMIN_ASSISTANT: NhaProposal = {
  program: 'Medical Administrative Assistant',
  credential: 'Certified Medical Administrative Assistant',
  credentialCode: 'CMAA',
  products: [
    {
      name: 'CMAA Exam Prep — Online Study Guide',
      description:
        'Online study guide with tutorials and end-of-module quizzes aligned with the CMAA Certification Exam.',
      listPrice: 84,
    },
    {
      name: 'CMAA Exam Prep — Online Practice Test',
      description:
        '6 attempts at online CMAA practice assessment with 6 Focused Review® reports and predictive analytics and readiness reports for candidate and facilitator.',
      listPrice: 0, // bundled in the $84 study guide line item
    },
    {
      name: 'CMAA Certification Exam',
      description: 'Online CMAA certification exam with test plan and exam results reporting.',
      listPrice: 129,
    },
    {
      name: 'Core Learning — Medical Terminology',
      description: '25 modules with end-of-module quizzes, implementation guides, and facilitator tool kit.',
      listPrice: 75,
    },
    {
      name: 'MA SkillsBuilder™ — Administrative Plus',
      description:
        '14 modules covering 7 administrative skills + 7 foundational content modules. Top 25 administrative skills.',
      listPrice: 129,
    },
  ],
  totalListPrice: 417,
  discountAmount: 75,
  totalDiscountedPrice: 342,
};

// ── EKG Technician (CET) ─────────────────────────────────────────────────────
// Available à la carte — same price structure as CPT phlebotomy.

export const NHA_EKG_PRODUCTS: NhaAlaCarteProduct[] = [
  {
    key: 'cet-study-guide',
    name: 'CET Online Study Guide',
    description:
      'Instructional lesson content aligned with the CET exam. Includes practice drill questions, interactive games, end-of-module quizzes, and professionalism tips.',
    listPrice: 54,
  },
  {
    key: 'cet-practice-test',
    name: 'CET Online Practice Test',
    description:
      '3 online assessments (2 attempts each) covering Safety/Compliance/Coordinated Patient Care, EKG Acquisition, and EKG Analysis and Interpretation.',
    listPrice: 49,
  },
  {
    key: 'cet-exam-prep-package',
    name: 'CET Exam Prep Package',
    description: 'Bundles CET Online Study Guide + CET Online Practice Test.',
    listPrice: 84,
  },
  {
    key: 'cet-certification-exam',
    name: 'CET Certification Exam',
    description: 'Online CET certification exam with test plan and exam results reporting.',
    listPrice: 129,
  },
];

/** Most cost-effective path: Exam Prep Package + Exam = $213 per learner. */
export const NHA_EKG_RECOMMENDED_COST =
  NHA_EKG_PRODUCTS.find(p => p.key === 'cet-exam-prep-package')!.listPrice +
  NHA_EKG_PRODUCTS.find(p => p.key === 'cet-certification-exam')!.listPrice; // $213

// ── Electronic Health Records (CEHRS) ────────────────────────────────────────
// Available à la carte.

export const NHA_EHR_PRODUCTS: NhaAlaCarteProduct[] = [
  {
    key: 'cehrs-study-guide',
    name: 'CEHRS Online Study Guide',
    description:
      'Practice drills covering all basic and necessary job skills. Includes 50 chapter drill questions, 15 case study drill questions, three case study videos and a summary video, with rationales for correct and incorrect answers.',
    listPrice: 50,
  },
  {
    key: 'cehrs-practice-test',
    name: 'CEHRS Online Practice Test',
    description:
      '5 attempts at online CEHRS assessment (500-minute time limit). Predictive analytics and readiness reports for candidate and facilitator.',
    listPrice: 44,
  },
  {
    key: 'cehrs-exam-prep-package',
    name: 'CEHRS Exam Prep Package',
    description: 'Bundles CEHRS Online Study Guide + CEHRS Online Practice Test.',
    listPrice: 75,
  },
  {
    key: 'cehrs-certification-exam',
    name: 'CEHRS Certification Exam',
    description: 'Online CEHRS certification exam with test plan and exam results reporting.',
    listPrice: 129,
  },
];

/** Most cost-effective path: Exam Prep Package + Exam = $204 per learner. */
export const NHA_EHR_RECOMMENDED_COST =
  NHA_EHR_PRODUCTS.find(p => p.key === 'cehrs-exam-prep-package')!.listPrice +
  NHA_EHR_PRODUCTS.find(p => p.key === 'cehrs-certification-exam')!.listPrice; // $204

// ── Helpers ───────────────────────────────────────────────────────────────────

/** All NHA proposals indexed by program slug. */
export const NHA_PROPOSALS: Record<string, NhaProposal> = {
  'medical-assistant':           NHA_MEDICAL_ASSISTANT,
  'pharmacy-technician':         NHA_PHARMACY_TECHNICIAN,
  'medical-admin-assistant':     NHA_MEDICAL_ADMIN_ASSISTANT,
  'medical-administrative-assistant': NHA_MEDICAL_ADMIN_ASSISTANT,
};

/** Exam-only cost for a given program slug (used in proctoring fee calculations). */
export const NHA_EXAM_FEE: Record<string, number> = {
  'medical-assistant':                165, // CCMA exam
  'pharmacy-technician':              129, // ExCPT exam (includes free retake)
  'phlebotomy-technician':            129, // CPT exam
  'ekg-technician':                   129, // CET exam
  'medical-admin-assistant':          129, // CMAA exam
  'medical-administrative-assistant': 129, // CMAA exam (alternate slug)
  'electronic-health-records':        129, // CEHRS exam
  'ehr-specialist':                   129, // CEHRS exam (alternate slug)
};

/** Full per-learner discounted cost including all prep materials + exam. */
export function getNhaPerLearnerCost(programSlug: string): number | null {
  return NHA_PROPOSALS[programSlug]?.totalDiscountedPrice ?? null;
}

/** Exam fee only for a given program slug. */
export function getNhaExamFee(programSlug: string): number | null {
  return NHA_EXAM_FEE[programSlug] ?? null;
}
